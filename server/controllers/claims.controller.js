const { pool } = require("../db");
const claimsQueries = require("../queries/claims.queries");

// POST /api/claims - Submit a new claim
async function createClaim(req, res) {
  const { itemId, claimantId, answers, handoverMethod } = req.body;

  // Extract identifying details either from answers object or top-level
  const identifyingDetail = answers?.identifyingDetail || req.body.identifyingDetail;
  const lossContext = answers?.lossContext || req.body.lossContext;
  const privateEvidence = answers?.privateEvidence || req.body.privateEvidence;
  const method = handoverMethod || req.body.handover_method;

  if (!itemId || !claimantId || !identifyingDetail || !lossContext || !privateEvidence || !method) {
    return res.status(400).json({
      message: "All fields are required (itemId, claimantId, identifying details, loss context, private evidence, handover method).",
    });
  }

  const client = await pool.connect();

  try {
    // 1. Verify item exists
    const item = await claimsQueries.getItemById(client, itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // 2. Prevent self-claim
    if (item.reporter_id === claimantId) {
      return res.status(403).json({
        message: "The reporter cannot claim their own item.",
      });
    }

    // 3. Check for existing active claim
    const existingClaim = await claimsQueries.findActiveClaimByClaimant(client, itemId, claimantId);
    if (existingClaim) {
      return res.status(409).json({
        message: "You already have an active claim for this item.",
      });
    }

    // 4. Begin transaction
    await client.query("BEGIN");

    const claimId = `CL${Date.now()}`;
    const claimPayload = {
      id: claimId,
      itemId,
      claimantId,
      identifyingDetail,
      lossContext,
      privateEvidence,
      handoverMethod: method,
      status: "Pending",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
    };

    const inserted = await claimsQueries.insertClaim(client, claimPayload);

    // If item was Active, transition to 'Pending Claim'
    if (item.status === "Active") {
      await claimsQueries.updateItemStatus(client, itemId, "Pending Claim");
    }

    // Create notification for the item reporter
    await claimsQueries.insertNotification(client, {
      id: `N${Date.now()}`,
      userId: item.reporter_id,
      type: "Item_Alert",
      title: "New Claim Submitted",
      message: `Someone submitted an ownership claim for your reported item "${item.title}".`,
      relatedId: claimId,
      read: false,
    });

    await client.query("COMMIT");

    const formatted = await claimsQueries.getClaimById(pool, claimId);

    return res.status(201).json({
      message: "Claim submitted successfully.",
      claim: formatted || claimsQueries.formatClaim(inserted),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating claim:", err);
    return res.status(500).json({
      message: "Internal server error while submitting claim.",
      error: err.message,
    });
  } finally {
    client.release();
  }
}

// GET /api/claims - List claims with optional filtering
async function getClaims(req, res) {
  try {
    const { itemId, claimantId, reporterId, status } = req.query;
    const claims = await claimsQueries.getClaims(pool, {
      itemId,
      claimantId,
      reporterId,
      status,
    });
    return res.status(200).json({ claims });
  } catch (err) {
    console.error("Error fetching claims:", err);
    return res.status(500).json({
      message: "Internal server error while fetching claims.",
      error: err.message,
    });
  }
}

// GET /api/claims/:id - Get a single claim by ID
async function getClaimById(req, res) {
  try {
    const { id } = req.params;
    const claim = await claimsQueries.getClaimById(pool, id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    return res.status(200).json({ claim });
  } catch (err) {
    console.error("Error fetching claim by id:", err);
    return res.status(500).json({
      message: "Internal server error while fetching claim.",
      error: err.message,
    });
  }
}

// PATCH /api/claims/:id - Approve, Reject, or Complete a claim
async function updateClaimDecision(req, res) {
  const { id } = req.params;
  const { status, reviewedBy } = req.body;

  if (!status || !["Approved", "Rejected", "Completed"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Allowed values are 'Approved', 'Rejected', 'Completed'.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch existing claim
    const claim = await claimsQueries.getClaimById(client, id);
    if (!claim) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Claim not found." });
    }

    const item = await claimsQueries.getItemById(client, claim.itemId);
    const reviewer = reviewedBy || null;

    if (status === "Approved") {
      // 1. Approve current claim
      await claimsQueries.updateClaimStatus(client, id, "Approved", reviewer);

      // 2. Reject all other competing pending claims for the same item
      const rejectedList = await claimsQueries.rejectCompetingClaims(client, claim.itemId, id, reviewer);

      // 3. Update item status to 'Reserved'
      await claimsQueries.updateItemStatus(client, claim.itemId, "Reserved");

      // 4. Notify the approved claimant
      await claimsQueries.insertNotification(client, {
        id: `N${Date.now()}_1`,
        userId: claim.claimantId,
        type: "Claim_Update",
        title: "Claim Approved",
        message: `Your claim for "${claim.itemTitle || item?.title}" has been approved! The item is now reserved.`,
        relatedId: id,
        read: false,
      });

      // 5. Notify competing rejected claimants
      for (let i = 0; i < rejectedList.length; i++) {
        const rejected = rejectedList[i];
        await claimsQueries.insertNotification(client, {
          id: `N${Date.now()}_comp_${i}`,
          userId: rejected.claimant_id,
          type: "Claim_Update",
          title: "Claim Update",
          message: `Another claim for "${claim.itemTitle || item?.title}" was approved. Your claim was rejected.`,
          relatedId: rejected.id,
          read: false,
        });
      }
    } else if (status === "Rejected") {
      // 1. Reject current claim
      await claimsQueries.updateClaimStatus(client, id, "Rejected", reviewer);

      // 2. Check if any other active claims remain for the item
      const activeCount = await claimsQueries.countActiveClaimsForItem(client, claim.itemId);
      if (activeCount === 0) {
        await claimsQueries.updateItemStatus(client, claim.itemId, "Active");
      }

      // 3. Notify the rejected claimant
      await claimsQueries.insertNotification(client, {
        id: `N${Date.now()}`,
        userId: claim.claimantId,
        type: "Claim_Update",
        title: "Claim Rejected",
        message: `Your claim for "${claim.itemTitle || item?.title}" was reviewed and rejected.`,
        relatedId: id,
        read: false,
      });
    } else if (status === "Completed") {
      // 1. Mark claim as Completed
      await claimsQueries.updateClaimStatus(client, id, "Completed", reviewer);

      // 2. Mark item as Solved
      await claimsQueries.updateItemStatus(client, claim.itemId, "Solved");

      // 3. Notify claimant
      await claimsQueries.insertNotification(client, {
        id: `N${Date.now()}`,
        userId: claim.claimantId,
        type: "Claim_Update",
        title: "Recovery Completed",
        message: `The recovery process for "${claim.itemTitle || item?.title}" has been completed.`,
        relatedId: id,
        read: false,
      });
    }

    await client.query("COMMIT");

    const updatedClaim = await claimsQueries.getClaimById(pool, id);
    const updatedItem = await claimsQueries.getItemById(pool, claim.itemId);

    return res.status(200).json({
      message: `Claim status updated to ${status}.`,
      claim: updatedClaim,
      itemStatus: updatedItem?.status,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating claim decision:", err);
    return res.status(500).json({
      message: "Internal server error while updating claim decision.",
      error: err.message,
    });
  } finally {
    client.release();
  }
}

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateClaimDecision,
};
