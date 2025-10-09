# Google Ads User Type Segmentation - Quick Reference Card

## 🎯 Custom Segments Setup

### Gifter Segment
```
Tools & Settings > Shared Library > Audience Manager > + Custom segments

Name: PawPop - Gift Buyers
Description: Users who selected "This is a gift" during checkout
Membership duration: 90 days
Segment:
  Include > Conditions > Custom parameters
  Parameter: user_type
  Condition: equals
  Value: gifter
```

### Self-Purchaser Segment
```
Name: PawPop - Self Purchasers
Description: Users who are buying for themselves
Membership duration: 90 days
Segment:
  Include > Conditions > Custom parameters
  Parameter: user_type
  Condition: equals
  Value: self_purchaser
```

---

## 📊 Custom Columns Setup

### Navigate
```
Campaigns > Columns icon (⋮) > Modify columns > Custom columns
```

### Column 1: Gifter Conversions
```
Name: Gifter Conversions
Type: Metrics
Aggregate function: Sum
Formatting: 0 decimal places
Formula: IF(user_type = 'gifter', Conversions, 0)
```

### Column 2: Gifter Value
```
Name: Gifter Value
Type: Metrics
Aggregate function: Sum
Formatting: 2 decimal places
Formula: IF(user_type = 'gifter', Conversion value, 0)
```

### Column 3: Self-Purchaser Conversions
```
Name: Self-Purchaser Conversions
Type: Metrics
Aggregate function: Sum
Formatting: 0 decimal places
Formula: IF(user_type = 'self_purchaser', Conversions, 0)
```

### Column 4: Self-Purchaser Value
```
Name: Self-Purchaser Value
Type: Metrics
Aggregate function: Sum
Formatting: 2 decimal places
Formula: IF(user_type = 'self_purchaser', Conversion value, 0)
```

### Column 5: Unknown Type Conversions
```
Name: Unknown Type Conversions
Type: Metrics
Aggregate function: Sum
Formatting: 0 decimal places
Formula: IF(user_type = 'unknown', Conversions, 0)
```

---

## 💾 Save Custom Report

```
After setting up columns:
  Save > Save as report
  Name: PawPop - Performance by User Type
  Segment by: user_type
```

---

## ✅ Verification Checklist

- [ ] Created "PawPop - Gift Buyers" segment
- [ ] Created "PawPop - Self Purchasers" segment
- [ ] Added "Gifter Conversions" column
- [ ] Added "Gifter Value" column
- [ ] Added "Self-Purchaser Conversions" column
- [ ] Added "Self-Purchaser Value" column
- [ ] Added "Unknown Type Conversions" column
- [ ] Saved custom report
- [ ] Waiting 24-48 hours for data

---

## 🔍 Data Verification

### Check Segments (After 24-48 hours)
```
Tools & Settings > Conversions > Select "Purchase" action > Segments tab
Look for: user_type parameter with values (gifter, self_purchaser, unknown)
```

### View Custom Report
```
Campaigns > Reports > Saved reports > "PawPop - Performance by User Type"
```

---

## 📈 Quick Analysis Formulas

### Conversion Rate by Type
```
Gifter CVR = Gifter Conversions ÷ Clicks (from gifter segment)
Self-Purchaser CVR = Self-Purchaser Conversions ÷ Clicks (from self-purchaser segment)
```

### Average Order Value
```
Gifter AOV = Gifter Value ÷ Gifter Conversions
Self-Purchaser AOV = Self-Purchaser Value ÷ Self-Purchaser Conversions
```

### Cost Per Acquisition
```
Gifter CPA = Cost (from gifter segment) ÷ Gifter Conversions
Self-Purchaser CPA = Cost (from self-purchaser segment) ÷ Self-Purchaser Conversions
```

---

## 🎯 Optimization Actions

### If Gifters Perform Better
- ✅ Create gift-focused ad copy
- ✅ Target gift occasions (birthdays, holidays)
- ✅ Emphasize gift packaging
- ✅ Bid higher on gift-related keywords

### If Self-Purchasers Perform Better
- ✅ Focus on personal enjoyment
- ✅ Emphasize home decor
- ✅ Target pet owner communities
- ✅ Highlight emotional connection

---

## 🆘 Troubleshooting

### No Data After 48 Hours
```bash
# Run monitoring script
npm run monitor:user-type-tracking

# Check console logs in production
# Look for: "📊 User type for conversion tracking: gifter"
```

### High "Unknown" Values
- Check if users are completing gift selection
- Verify user_type is being saved to database
- Review UploadModalEmailFirst component

---

**For detailed instructions, see:**
`docs/marketing/GOOGLE_ADS_USER_TYPE_SEGMENTATION.md`
