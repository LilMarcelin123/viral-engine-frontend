// Precio que se cobra al cliente por video (distinto de lo que se paga al editor)
export const CLIENT_PRICE_PER_VIDEO = 120;

export const clientBudget = (campaign) => (campaign.num_videos || 0) * CLIENT_PRICE_PER_VIDEO;