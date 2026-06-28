const moduleRepository = require('../repositories/moduleRepository');

const defaultModules = [
  {
    name: 'Instagram',
    slug: 'instagram',
    description: 'Track Instagram growth and engagement metrics',
    icon: 'instagram',
    color: '#E4405F',
    isDefault: true,
    fields: [
      { name: 'Followers', slug: 'followers', type: 'number', required: true, order: 1, isActive: true },
      { name: 'Accounts Reached', slug: 'accounts_reached', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Profile Visits', slug: 'profile_visits', type: 'number', required: true, order: 3, isActive: true },
      { name: 'Story Views', slug: 'story_views', type: 'number', required: false, order: 4, isActive: true },
      { name: 'Reel Views', slug: 'reel_views', type: 'number', required: false, order: 5, isActive: true },
      { name: 'Post Engagement', slug: 'post_engagement', type: 'number', required: false, order: 6, isActive: true },
    ],
  },
  {
    name: 'WhatsApp Community',
    slug: 'whatsapp-community',
    description: 'Track WhatsApp community growth and activity',
    icon: 'whatsapp',
    color: '#25D366',
    isDefault: true,
    fields: [
      { name: 'Community Members', slug: 'community_members', type: 'number', required: true, order: 1, isActive: true },
      { name: 'New Members Joined', slug: 'new_members_joined', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Messages Sent', slug: 'messages_sent', type: 'number', required: true, order: 3, isActive: true },
      { name: 'Active Participants', slug: 'active_participants', type: 'number', required: false, order: 4, isActive: true },
    ],
  },
  {
    name: 'YouTube',
    slug: 'youtube',
    description: 'Track YouTube channel metrics',
    icon: 'youtube',
    color: '#FF0000',
    isDefault: true,
    fields: [
      { name: 'Subscribers', slug: 'subscribers', type: 'number', required: true, order: 1, isActive: true },
      { name: 'Views', slug: 'views', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Watch Time (hrs)', slug: 'watch_time', type: 'number', required: true, order: 3, isActive: true },
      { name: 'Likes', slug: 'likes', type: 'number', required: false, order: 4, isActive: true },
      { name: 'Comments', slug: 'comments', type: 'number', required: false, order: 5, isActive: true },
    ],
  },
  {
    name: 'Facebook',
    slug: 'facebook',
    description: 'Track Facebook Page growth and engagement',
    icon: 'facebook',
    color: '#1877F2',
    isDefault: true,
    fields: [
      { name: 'Page Followers', slug: 'page_followers', type: 'number', required: true, order: 1, isActive: true },
      { name: 'Page Reach', slug: 'page_reach', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Post Engagement', slug: 'post_engagement', type: 'number', required: true, order: 3, isActive: true },
      { name: 'New Page Likes', slug: 'new_page_likes', type: 'number', required: true, order: 4, isActive: true },
      { name: 'Page Views', slug: 'page_views', type: 'number', required: true, order: 5, isActive: true },
      { name: 'Video Views', slug: 'video_views', type: 'number', required: false, order: 6, isActive: true },
    ],
  },
  {
    name: 'LinkedIn',
    slug: 'linkedin',
    description: 'Track LinkedIn company page and content performance',
    icon: 'linkedin',
    color: '#0A66C2',
    isDefault: true,
    fields: [
      { name: 'Followers', slug: 'followers', type: 'number', required: true, order: 1, isActive: true },
      { name: 'Impressions', slug: 'impressions', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Engagement Rate', slug: 'engagement_rate', type: 'percentage', required: true, order: 3, isActive: true },
      { name: 'Profile Views', slug: 'profile_views', type: 'number', required: true, order: 4, isActive: true },
      { name: 'Post Clicks', slug: 'post_clicks', type: 'number', required: true, order: 5, isActive: true },
      { name: 'Connection Requests', slug: 'connection_requests', type: 'number', required: false, order: 6, isActive: true },
    ],
  },
  {
    name: 'Google My Business',
    slug: 'google-my-business',
    description: 'Track Google Business Profile visibility and customer actions',
    icon: 'google',
    color: '#4285F4',
    isDefault: true,
    fields: [
      { name: 'Profile Views', slug: 'profile_views', type: 'number', required: true, order: 1, isActive: true },
      { name: 'Search Views', slug: 'search_views', type: 'number', required: true, order: 2, isActive: true },
      { name: 'Map Views', slug: 'map_views', type: 'number', required: true, order: 3, isActive: true },
      { name: 'Phone Calls', slug: 'phone_calls', type: 'number', required: true, order: 4, isActive: true },
      { name: 'Website Clicks', slug: 'website_clicks', type: 'number', required: true, order: 5, isActive: true },
      { name: 'Direction Requests', slug: 'direction_requests', type: 'number', required: true, order: 6, isActive: true },
      { name: 'Reviews Count', slug: 'reviews_count', type: 'number', required: true, order: 7, isActive: true },
      { name: 'Average Rating', slug: 'average_rating', type: 'number', required: true, order: 8, isActive: true },
    ],
  },
];

async function seedDefaultModules(businessId, userId, { skipExisting = true } = {}) {
  let created = 0;
  let skipped = 0;

  for (const mod of defaultModules) {
    if (skipExisting) {
      const existing = await moduleRepository.findBySlug(businessId, mod.slug);
      if (existing) {
        skipped += 1;
        continue;
      }
    }

    await moduleRepository.create({
      businessId,
      createdBy: userId,
      isActive: true,
      ...mod,
    });
    created += 1;
  }

  return { created, skipped, total: defaultModules.length };
}

module.exports = { defaultModules, seedDefaultModules };
