# Monthly Credits System

## Overview
All registered users receive 100 FREE QR credits automatically every month. This is a retention and engagement feature that rewards both free and paid users.

## How It Works

### Automatic Distribution
1. **Vercel Cron Job**: Runs on the 1st of each month at 00:00 UTC
2. **API Endpoint**: `/api/cron/monthly-credits`
3. **Eligibility**: All users who haven't received the monthly bonus in the current month
4. **Amount**: 100 credits added to both `total` and `remaining` fields
5. **Transaction Type**: `monthly_bonus` with description "Monthly bonus - 100 free QR credits"

### Login Bonus Check
In addition to the cron job, when users log in:
1. System checks if they've received this month's bonus via `/api/credits/monthly-bonus` (POST)
2. If not received, credits are added immediately
3. Success banner shows: "🎉 Monthly Bonus Received! +100 free QR credits"
4. Banner auto-dismisses after 10 seconds

### UI Advertising
The monthly credits feature is prominently advertised throughout the site:

1. **Credit Balance Display** (for logged-in users):
   - Purple/pink gradient banner at top
   - "Get 100 FREE Credits Every Month! 🎁" message
   - Explains automatic monthly distribution

2. **Signup Prompt** (for visitors):
   - Similar banner highlighting monthly bonuses
   - "Sign up now and receive 100 bonus QR credits automatically every month"
   - Emphasizes "No catch, no credit card required!"

3. **Homepage Info Cards**:
   - Replaced "Never Expire" card with "🎁 Monthly Bonus" card
   - Shows "100 FREE Credits every month" in purple gradient styling

4. **Transaction History**:
   - Monthly bonus transactions highlighted with 🎁 emoji
   - Purple badge labeled "Monthly Bonus"
   - Shows "FREE" instead of dollar amount
   - Green "+100" credit display

## Cron Configuration

### Vercel Cron Setup
```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-credits",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Schedule**: `0 0 1 * *` = Every 1st day of the month at 00:00 UTC

### Manual Trigger
You can manually trigger the monthly credits distribution:

```bash
# With authorization header
curl -X GET https://your-domain.vercel.app/api/cron/monthly-credits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Add to Vercel environment variables:
```
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Schema

### Transactions Table
Monthly bonuses are recorded with:
- `type = 'monthly_bonus'`
- `amount = 0` (free)
- `credits = 100`
- `description = 'Monthly bonus - 100 free QR credits'`

### Duplicate Prevention
Query checks for existing `monthly_bonus` transactions in current month:
```sql
SELECT 1 FROM transactions
WHERE user_id = ${userId}
AND type = 'monthly_bonus'
AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
```

## Testing

### Test Monthly Bonus API (logged-in user)
```bash
# POST request (user must be authenticated)
curl -X POST http://localhost:3000/api/credits/monthly-bonus \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

**Expected Response (first time this month)**:
```json
{
  "success": true,
  "creditsAdded": 100,
  "newBalance": {
    "total": 51200,
    "used": 2000,
    "remaining": 49200
  }
}
```

**Expected Response (already received)**:
```json
{
  "alreadyReceived": true,
  "message": "Monthly credits already received this month"
}
```

### Test Cron Endpoint
```bash
# GET request with authorization
curl -X GET http://localhost:3000/api/cron/monthly-credits \
  -H "Authorization: Bearer dev-cron-secret-change-in-production"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Monthly credits distributed successfully",
  "usersProcessed": 5,
  "totalEligible": 5
}
```

## Manual Script (Alternative)
If you prefer to run monthly credits manually via Node.js:

```bash
node scripts/monthly-credits.js
```

This is useful for:
- Local testing
- Manual distribution
- Backup if cron fails

## Monitoring

### Check Who Received This Month
```sql
SELECT u.email, u.name, t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.type = 'monthly_bonus'
AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY t.created_at DESC;
```

### Check Who Hasn't Received Yet
```sql
SELECT u.id, u.email, u.name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.user_id = u.id
  AND t.type = 'monthly_bonus'
  AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
);
```

## Troubleshooting

### Cron Not Running
1. Check Vercel dashboard → Project → Settings → Cron Jobs
2. Verify cron is enabled for your project (requires Pro plan)
3. Check deployment logs for errors
4. Manually trigger via API endpoint to test logic

### Duplicate Credits
The system prevents duplicates by:
1. Checking for existing `monthly_bonus` transaction in current month
2. Using `DATE_TRUNC('month', CURRENT_DATE)` to ensure month-level granularity
3. Transaction records timestamped with `created_at`

### User Not Receiving Credits
1. Check if user has existing `monthly_bonus` transaction this month
2. Verify credits table has record for user
3. Check transaction logs for errors
4. Try manual distribution via script

## Cost Considerations
- **100 credits × all users = potential high volume**
- If you have 10,000 users = 1,000,000 free credits distributed monthly
- Monitor usage and adjust strategy if needed
- Consider limiting to active users only (logged in past 30 days)

## Future Enhancements
- [ ] Add "Next bonus in X days" countdown display
- [ ] Email notification when monthly credits are added
- [ ] Limit to active users only (optional optimization)
- [ ] Admin dashboard to view distribution statistics
- [ ] A/B test different bonus amounts for engagement
