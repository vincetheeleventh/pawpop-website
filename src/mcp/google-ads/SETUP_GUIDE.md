# Google Ads MCP Setup Guide for PawPop

This guide will help you complete the Google Ads MCP integration for your PawPop project.

## Current Status ✅

- [x] Python 3.11 installed via Homebrew
- [x] Virtual environment created with all dependencies
- [x] MCP server files downloaded and configured
- [x] Template files created for secure configuration
- [x] .gitignore updated to prevent secret commits

## Security Setup 🔒

**IMPORTANT**: This setup includes template files to prevent accidentally committing secrets to git.

### Template Files Created:
- `client_secret.json.example` - Template for OAuth credentials
- `mcp_config.example.json` - Template for MCP configuration
- `.env.example` - Template for environment variables

### Your Actual Files (NOT committed to git):
- `client_secret.json` - Your actual OAuth credentials
- `mcp_config.json` - Your actual MCP configuration with real API keys
- `.env` - Your actual environment variables

## Next Steps to Complete Setup

### 1. Set Up Your OAuth Credentials

1. Copy the template and add your real credentials:
   ```bash
   cp client_secret.json.example client_secret.json
   ```
2. Edit `client_secret.json` with your actual OAuth credentials from Google Cloud Console
3. Your `client_secret.json.backup` file contains your original credentials if needed

### 2. Configure MCP Settings

1. Copy the template and add your real API keys:
   ```bash
   cp mcp_config.example.json mcp_config.json
   ```
2. Edit `mcp_config.json` and replace:
   - `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project ref
   - `YOUR_SUPABASE_ACCESS_TOKEN` with your actual Supabase token
   - `YOUR_DEVELOPER_TOKEN_HERE` with your Google Ads developer token
   - `YOUR_STRIPE_TEST_API_KEY` with your Stripe test key
   - Update the username paths from `YOUR_USERNAME` to `vincexi`

### 3. Get Your Google Ads Developer Token

1. Go to [Google Ads](https://ads.google.com)
2. Click **Tools & Settings** (wrench icon)
3. Under **Setup**, click **API Center**
4. Accept Terms of Service if prompted
5. Click **Apply for token**
6. Fill out the application form
7. Wait for approval (usually 1-3 business days)

### 4. Configure Environment Variables

Edit the `.env` file in this directory and update these values:

```bash
# Replace with your actual developer token
GOOGLE_ADS_DEVELOPER_TOKEN=your_actual_developer_token_here

# If you have a Manager Account (MCC), add the ID here
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_manager_account_id_here
```

### 5. Test the Integration

Once you have your credentials set up:

1. Restart Windsurf
2. The Google Ads MCP server should appear in your available tools
3. Try asking questions like:
   - "Show me my Google Ads campaigns"
   - "What's the performance of my ads this month?"
   - "Get keyword data for my campaigns"

## File Structure

```
src/mcp/google-ads/
├── .env                           # Your environment configuration (gitignored)
├── .env.example                   # Template file (committed)
├── .venv/                         # Python virtual environment (gitignored)
├── client_secret.json             # Your OAuth credentials (gitignored)
├── client_secret.json.example     # Template file (committed)
├── client_secret.json.backup      # Your original credentials backup
├── google_ads_server.py           # MCP server implementation
├── requirements.txt               # Python dependencies
├── keywords.csv                   # Sample data file
└── SETUP_GUIDE.md                # This guide

Root directory:
├── mcp_config.json                # Your MCP configuration (gitignored)
└── mcp_config.example.json        # Template file (committed)
```

## Security Notes 🔐

- **All sensitive files are gitignored** to prevent accidental commits
- **Template files** are provided for safe sharing and setup
- **Never commit** your actual `client_secret.json`, `mcp_config.json`, or `.env` files
- **Keep your developer token secure** and don't share it
- **Use the backup file** if you need to restore your original credentials

## Troubleshooting

### Authentication Issues
- Ensure `client_secret.json` is in the correct location with real credentials
- Check that your developer token is valid and approved
- Verify OAuth credentials are for the correct Google Cloud project

### MCP Server Not Appearing
- Restart Windsurf completely
- Check the `mcp_config.json` file has correct paths and real API keys
- Verify the virtual environment has all dependencies installed

### Permission Errors
- Ensure the Python executable path is correct in MCP configuration
- Check that the virtual environment was created successfully

### GitHub Push Protection
If you see secret scanning errors:
- The `.gitignore` has been updated to prevent future issues
- Template files are safe to commit
- Never commit files containing real API keys or secrets

## Available Tools

Once configured, you'll have access to these Google Ads tools:

- **Campaign Management**: View and analyze campaign performance
- **Keyword Analysis**: Get keyword metrics and suggestions
- **Ad Performance**: Analyze ad group and ad performance
- **Account Overview**: Get account-level insights
- **Custom Queries**: Run advanced Google Ads Query Language (GAQL) queries

## Support

For issues with the Google Ads MCP:
- Check the [official repository](https://github.com/cohnen/mcp-google-ads)
- Review Google Ads API documentation
- Ensure your Google Ads account has API access enabled
