from typing import Any, Dict, List, Optional, Union
from pydantic import Field
import os
import json
import requests
from datetime import datetime, timedelta

from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
import logging
import pandas as pd

# MCP
from mcp.server.fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('google_ads_server')

mcp = FastMCP(
    "google-ads-server",
    dependencies=[
        "google-auth-oauthlib",
        "google-auth",
        "requests",
        "python-dotenv",
        "pandas"
    ]
)

# Constants and configuration
SCOPES = ['https://www.googleapis.com/auth/adwords']
API_VERSION = "v19"  # Google Ads API version

# Load environment variables
try:
    from dotenv import load_dotenv
    # Load from .env file if it exists
    load_dotenv()
    logger.info("Environment variables loaded from .env file")
except ImportError:
    logger.warning("python-dotenv not installed, skipping .env file loading")

# Get credentials from environment variables
GOOGLE_ADS_CREDENTIALS_PATH = os.environ.get("GOOGLE_ADS_CREDENTIALS_PATH")
GOOGLE_ADS_DEVELOPER_TOKEN = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN")
GOOGLE_ADS_LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "")
GOOGLE_ADS_AUTH_TYPE = os.environ.get("GOOGLE_ADS_AUTH_TYPE", "oauth")  # oauth or service_account

def format_customer_id(customer_id: str) -> str:
    """Format customer ID to ensure it's 10 digits without dashes."""
    # Convert to string if passed as integer or another type
    customer_id = str(customer_id)
    
    # Remove any quotes surrounding the customer_id (both escaped and unescaped)
    customer_id = customer_id.replace('\"', '').replace('"', '')
    
    # Remove any non-digit characters (including dashes, braces, etc.)
    customer_id = ''.join(char for char in customer_id if char.isdigit())
    
    # Ensure it's 10 digits with leading zeros if needed
    return customer_id.zfill(10)

def get_credentials():
    """
    Get and refresh OAuth credentials or service account credentials based on the auth type.
    
    This function supports two authentication methods:
    1. OAuth 2.0 (User Authentication) - For individual users or desktop applications
    2. Service Account (Server-to-Server Authentication) - For automated systems

    Returns:
        Valid credentials object to use with Google Ads API
    """
    if not GOOGLE_ADS_CREDENTIALS_PATH:
        raise ValueError("GOOGLE_ADS_CREDENTIALS_PATH environment variable not set")
    
    auth_type = GOOGLE_ADS_AUTH_TYPE.lower()
    logger.info(f"Using authentication type: {auth_type}")
    
    # Service Account authentication
    if auth_type == "service_account":
        try:
            return get_service_account_credentials()
        except Exception as e:
            logger.error(f"Error with service account authentication: {str(e)}")
            raise
    
    # OAuth 2.0 authentication (default)
    return get_oauth_credentials()

def get_service_account_credentials():
    """Get credentials using a service account key file."""
    logger.info(f"Loading service account credentials from {GOOGLE_ADS_CREDENTIALS_PATH}")
    
    if not os.path.exists(GOOGLE_ADS_CREDENTIALS_PATH):
        raise FileNotFoundError(f"Service account key file not found at {GOOGLE_ADS_CREDENTIALS_PATH}")
    
    try:
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_ADS_CREDENTIALS_PATH, 
            scopes=SCOPES
        )
        
        # Check if impersonation is required
        impersonation_email = os.environ.get("GOOGLE_ADS_IMPERSONATION_EMAIL")
        if impersonation_email:
            logger.info(f"Impersonating user: {impersonation_email}")
            credentials = credentials.with_subject(impersonation_email)
            
        return credentials
        
    except Exception as e:
        logger.error(f"Error loading service account credentials: {str(e)}")
        raise

def get_oauth_credentials():
    """Get and refresh OAuth user credentials."""
    creds = None
    client_config = None
    
    # Path to store the refreshed token
    token_path = GOOGLE_ADS_CREDENTIALS_PATH
    if os.path.exists(token_path) and not os.path.basename(token_path).endswith('.json'):
        # If it's not explicitly a .json file, append a default name
        token_dir = os.path.dirname(token_path)
        token_path = os.path.join(token_dir, 'google_ads_token.json')
    
    # Check if token file exists and load credentials
    if os.path.exists(token_path):
        try:
            logger.info(f"Loading OAuth credentials from {token_path}")
            with open(token_path, 'r') as f:
                creds_data = json.load(f)
                # Check if this is a client config or saved credentials
                if "installed" in creds_data or "web" in creds_data:
                    client_config = creds_data
                    logger.info("Found OAuth client configuration")
                else:
                    logger.info("Found existing OAuth token")
                    creds = Credentials.from_authorized_user_info(creds_data, SCOPES)
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON in token file: {token_path}")
            creds = None
        except Exception as e:
            logger.warning(f"Error loading credentials: {str(e)}")
            creds = None
    
    # If credentials don't exist or are invalid, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                logger.info("Refreshing expired token")
                creds.refresh(Request())
                logger.info("Token successfully refreshed")
            except RefreshError as e:
                logger.warning(f"Error refreshing token: {str(e)}, will try to get new token")
                creds = None
            except Exception as e:
                logger.error(f"Unexpected error refreshing token: {str(e)}")
                raise
        
        # If we need new credentials
        if not creds:
            # If no client_config is defined yet, create one from environment variables
            if not client_config:
                logger.info("Creating OAuth client config from environment variables")
                client_id = os.environ.get("GOOGLE_ADS_CLIENT_ID")
                client_secret = os.environ.get("GOOGLE_ADS_CLIENT_SECRET")
                
                if not client_id or not client_secret:
                    raise ValueError("GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be set if no client config file exists")
                
                client_config = {
                    "installed": {
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                    }
                }
            
            # Run the OAuth flow
            logger.info("Starting OAuth authentication flow")
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            creds = flow.run_local_server(port=0)
            logger.info("OAuth flow completed successfully")
        
        # Save the refreshed/new credentials
        try:
            logger.info(f"Saving credentials to {token_path}")
            # Ensure directory exists
            os.makedirs(os.path.dirname(token_path), exist_ok=True)
            with open(token_path, 'w') as f:
                f.write(creds.to_json())
        except Exception as e:
            logger.warning(f"Could not save credentials: {str(e)}")
    
    return creds

def get_headers(creds):
    """Get headers for Google Ads API requests."""
    if not GOOGLE_ADS_DEVELOPER_TOKEN:
        raise ValueError("GOOGLE_ADS_DEVELOPER_TOKEN environment variable not set")
    
    # Handle different credential types
    if isinstance(creds, service_account.Credentials):
        # For service account, we need to get a new bearer token
        auth_req = Request()
        creds.refresh(auth_req)
        token = creds.token
    else:
        # For OAuth credentials, check if token needs refresh
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                try:
                    logger.info("Refreshing expired OAuth token in get_headers")
                    creds.refresh(Request())
                    logger.info("Token successfully refreshed in get_headers")
                except RefreshError as e:
                    logger.error(f"Error refreshing token in get_headers: {str(e)}")
                    raise ValueError(f"Failed to refresh OAuth token: {str(e)}")
                except Exception as e:
                    logger.error(f"Unexpected error refreshing token: {str(e)}")
                    raise
        token = creds.token
    
    headers = {
        "Authorization": f"Bearer {token}",
        "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
        "Content-Type": "application/json"
    }
    
    if GOOGLE_ADS_LOGIN_CUSTOMER_ID:
        headers["login-customer-id"] = format_customer_id(GOOGLE_ADS_LOGIN_CUSTOMER_ID)
        
    return headers

@mcp.tool()
async def list_accounts() -> str:
    """
    List all accessible Google Ads accounts.
    
    Returns:
        A formatted string of all accessible accounts with their IDs and names.
    """
    try:
        creds = get_credentials()
        headers = get_headers(creds)
        
        # The endpoint for listing accessible customers
        url = f"https://googleads.googleapis.com/{API_VERSION}/customers:listAccessibleCustomers"
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return f"Error listing accounts: {response.text}"
        
        data = response.json()
        resource_names = data.get('resourceNames', [])
        
        if not resource_names:
            return "No accessible Google Ads accounts found."
        
        # Extract customer IDs from resource names
        customer_ids = [name.split('/')[-1] for name in resource_names]
        
        # Query to get account details
        query = f"""
            SELECT 
                customer.id, 
                customer.descriptive_name, 
                customer.currency_code, 
                customer.manager, 
                customer.test_account 
            FROM customer 
            WHERE customer.id IN ({', '.join(customer_ids)})
        """
        
        # Use the first customer ID for the request URL, as it's just for routing
        request_customer_id = format_customer_id(customer_ids[0])
        search_url = f"https://googleads.googleapis.com/{API_VERSION}/customers/{request_customer_id}/googleAds:search"
        
        payload = {"query": query}
        search_response = requests.post(search_url, headers=headers, json=payload)
        
        if search_response.status_code != 200:
            return f"Error fetching account details: {search_response.text}"
        
        search_results = search_response.json()
        
        # Format the output
        output_lines = ["Accessible Google Ads Accounts:"]
        output_lines.append("=" * 80)
        output_lines.append(f"{'ID':<15} | {'Name':<40} | {'Currency':<10} | {'Manager?':<10} | {'Test Acct?':<10}")
        output_lines.append("-" * 80)
        
        for result in search_results.get('results', []):
            customer = result.get('customer', {})
            customer_id_str = customer.get('id', 'N/A')
            descriptive_name = customer.get('descriptiveName', 'N/A')
            currency_code = customer.get('currencyCode', 'N/A')
            is_manager = str(customer.get('manager', False))
            is_test_account = str(customer.get('testAccount', False))
            
            output_lines.append(f"{customer_id_str:<15} | {descriptive_name:<40} | {currency_code:<10} | {is_manager:<10} | {is_test_account:<10}")
        
        return "\n".join(output_lines)
        
    except Exception as e:
        return f"An error occurred: {str(e)}"

@mcp.tool()
async def execute_gaql_query(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    query: str = Field(description="GAQL query to execute. Example: 'SELECT campaign.name, metrics.clicks FROM campaign'")
) -> Union[Dict[str, Any], str]:
    """
    Execute a Google Ads Query Language (GAQL) query for a specific customer.
    
    Args:
        customer_id: The Google Ads customer ID as a string (10 digits, no dashes)
        query: The GAQL query to execute
        
    Returns:
        JSON response from the API or an error string
    """
    try:
        creds = get_credentials()
        headers = get_headers(creds)
        
        formatted_customer_id = format_customer_id(customer_id)
        url = f"https://googleads.googleapis.com/{API_VERSION}/customers/{formatted_customer_id}/googleAds:search"
        
        payload = {"query": query}
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            return f"Error executing query: {response.text}"
            
    except Exception as e:
        return f"An error occurred: {str(e)}"

@mcp.tool()
async def get_campaign_performance(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    days: int = Field(default=30, description="Number of days to look back (7, 30, 90, etc.)")
) -> str:
    """
    Get campaign performance metrics for a specified number of days.
    
    Args:
        customer_id: The Google Ads customer ID as a string (10 digits, no dashes)
        days: Number of days to look back (default: 30)
        
    Returns:
        Formatted string with campaign performance data
    """
    # Use a valid date range format
    if days == 7:
        date_range = "LAST_7_DAYS"
    elif days == 14:
        date_range = "LAST_14_DAYS"
    elif days == 30:
        date_range = "LAST_30_DAYS"
    else:
        # Default to 30 days if not a standard range
        date_range = "LAST_30_DAYS"
        
    query = f"""
        SELECT 
            campaign.name, 
            metrics.impressions, 
            metrics.clicks, 
            metrics.ctr, 
            metrics.average_cpc, 
            metrics.cost_micros, 
            metrics.conversions, 
            metrics.cost_per_conversion 
        FROM campaign 
        WHERE segments.date DURING {date_range}
        ORDER BY metrics.impressions DESC
    """
    
    try:
        response = await execute_gaql_query(customer_id, query)
        
        if isinstance(response, str):
            return response
        
        results = response.get('results', [])
        if not results:
            return "No campaign performance data found for this customer ID and time period."
        
        # Format the output
        output_lines = [f"Campaign Performance for Customer ID {customer_id} (Last {days} days):"]
        output_lines.append("=" * 120)
        output_lines.append(f"{'Campaign Name':<40} | {'Impressions':<15} | {'Clicks':<10} | {'CTR':<8} | {'Avg CPC':<12} | {'Cost':<15} | {'Conversions':<12} | {'Cost/Conv':<15}")
        output_lines.append("-" * 120)
        
        for result in results:
            campaign = result.get('campaign', {})
            metrics = result.get('metrics', {})
            
            campaign_name = campaign.get('name', 'N/A')
            impressions = int(metrics.get('impressions', 0))
            clicks = int(metrics.get('clicks', 0))
            ctr = float(metrics.get('ctr', 0)) * 100
            avg_cpc = float(metrics.get('averageCpc', 0)) / 1_000_000
            cost = float(metrics.get('costMicros', 0)) / 1_000_000
            conversions = float(metrics.get('conversions', 0))
            cost_per_conversion = float(metrics.get('costPerConversion', 0)) / 1_000_000
            
            output_lines.append(f"{campaign_name:<40.40} | {impressions:<15,} | {clicks:<10,} | {ctr:>6.2f}% | {avg_cpc:>10.2f} | {cost:>13,.2f} | {conversions:>11.2f} | {cost_per_conversion:>13,.2f}")
            
        return "\n".join(output_lines)
    
    except Exception as e:
        return f"An error occurred: {str(e)}"

@mcp.tool()
async def get_ad_performance(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    days: int = Field(default=30, description="Number of days to look back (7, 30, 90, etc.)")
) -> str:
    """
    Get detailed ad performance metrics for a specified number of days.
    
    Args:
        customer_id: The Google Ads customer ID as a string (10 digits, no dashes)
        days: Number of days to look back (default: 30)
        
    Returns:
        Formatted string with detailed ad performance data
    """
    # Use a valid date range format
    if days == 7:
        date_range = "LAST_7_DAYS"
    elif days == 14:
        date_range = "LAST_14_DAYS"
    elif days == 30:
        date_range = "LAST_30_DAYS"
    else:
        date_range = "LAST_30_DAYS"
        
    query = f"""
        SELECT
            ad_group_ad.ad.name,
            ad_group_ad.ad.id,
            ad_group.name,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.conversions,
            metrics.cost_micros
        FROM ad_group_ad
        WHERE segments.date DURING {date_range}
        ORDER BY metrics.impressions DESC
        LIMIT 100
    """
    
    try:
        response = await execute_gaql_query(customer_id, query)
        
        if isinstance(response, str):
            return response
        
        results = response.get('results', [])
        if not results:
            return "No ad performance data found for this customer ID and time period."
        
        # Format the output
        output_lines = [f"Ad Performance for Customer ID {customer_id} (Last {days} days):"]
        output_lines.append("=" * 150)
        output_lines.append(f"{'Ad Name':<40} | {'Ad Group':<30} | {'Campaign':<30} | {'Impressions':<15} | {'Clicks':<10} | {'CTR':<8} | {'Conversions':<12} | {'Cost':<15}")
        output_lines.append("-" * 150)
        
        for result in results:
            ad_group_ad = result.get('adGroupAd', {}).get('ad', {})
            ad_group = result.get('adGroup', {})
            campaign = result.get('campaign', {})
            metrics = result.get('metrics', {})
            
            ad_name = ad_group_ad.get('name', f"Ad ID: {ad_group_ad.get('id', 'N/A')}")
            ad_group_name = ad_group.get('name', 'N/A')
            campaign_name = campaign.get('name', 'N/A')
            impressions = int(metrics.get('impressions', 0))
            clicks = int(metrics.get('clicks', 0))
            ctr = float(metrics.get('ctr', 0)) * 100
            conversions = float(metrics.get('conversions', 0))
            cost = float(metrics.get('costMicros', 0)) / 1_000_000
            
            output_lines.append(f"{ad_name:<40.40} | {ad_group_name:<30.30} | {campaign_name:<30.30} | {impressions:<15,} | {clicks:<10,} | {ctr:>6.2f}% | {conversions:>11.2f} | {cost:>13,.2f}")
            
        return "\n".join(output_lines)
        
    except Exception as e:
        return f"An error occurred: {str(e)}"

@mcp.tool()
async def run_gaql(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    query: str = Field(description="The GAQL query to run. Example: 'SELECT campaign.name FROM campaign'"),
    format_as: str = Field(default="table", description="Output format: 'table', 'json', or 'csv'")
) -> str:
    """
    Run an arbitrary GAQL query and format the output.
    
    Args:
        customer_id: The Google Ads customer ID
        query: The GAQL query to execute
        format_as: The desired output format ('table', 'json', or 'csv')
        
    Returns:
        Formatted string with the query results
    """
    try:
        response = await execute_gaql_query(customer_id, query)
        
        if isinstance(response, str):
            return response
        
        if format_as.lower() == 'json':
            return json.dumps(response, indent=2)
        
        results = response.get('results', [])
        if not results:
            return "Query returned no results."
        
        # Extract headers from the first result
        first_result = results[0]
        headers = list(first_result.keys())
        
        # Format as CSV
        if format_as.lower() == 'csv':
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(headers)
            
            # Write rows
            for result in results:
                row = [json.dumps(result.get(h, '')) for h in headers]
                writer.writerow(row)
            
            return output.getvalue()
        
        # Format as table (default)
        # Calculate column widths
        col_widths = {h: len(h) for h in headers}
        for result in results:
            for h in headers:
                cell_content = json.dumps(result.get(h, ''), indent=2)
                col_widths[h] = max(col_widths[h], len(cell_content.split('\n')[0]))
        
        # Create table header
        header_line = " | ".join([f"{h:<{col_widths[h]}}" for h in headers])
        separator_line = "-+- ".join(["-" * col_widths[h] for h in headers])
        
        output_lines = [header_line, separator_line]
        
        # Create table rows
        for result in results:
            row_lines = [json.dumps(result.get(h, ''), indent=2).split('\n') for h in headers]
            max_lines = max(len(lines) for lines in row_lines)
            
            for i in range(max_lines):
                row_str = " | ".join([
                    f"{(row_lines[j][i] if i < len(row_lines[j]) else ''):<{col_widths[h]}}" 
                    for j, h in enumerate(headers)
                ])
                output_lines.append(row_str)
            
            output_lines.append(separator_line)
            
        return "\n".join(output_lines)
        
    except Exception as e:
        return f"An error occurred while running GAQL: {str(e)}"

@mcp.tool()
async def get_account_currency(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'")
) -> str:
    """
    Get the currency code for a specific Google Ads account.
    
    Args:
        customer_id: The Google Ads customer ID as a string
        
    Returns:
        The currency code (e.g., 'USD') or an error message
    """
    query = f"SELECT customer.currency_code FROM customer WHERE customer.id = '{format_customer_id(customer_id)}'"
    
    try:
        response = await execute_gaql_query(customer_id, query)
        
        if isinstance(response, str):
            return response
        
        results = response.get('results', [])
        if not results:
            return f"Could not find currency for customer ID {customer_id}"
        
        currency_code = results[0].get('customer', {}).get('currencyCode', 'N/A')
        return f"The currency for account {customer_id} is {currency_code}."
    
    except Exception as e:
        return f"Error getting currency: {str(e)}"

@mcp.tool()
async def get_asset_usage(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    asset_id: str = Field(description="The ID of the asset to check. Example: '123456789'")
) -> str:
    """
    Find where a specific asset (like an image or text) is being used.
    
    Args:
        customer_id: The Google Ads customer ID as a string
        asset_id: The ID of the asset to look for
        
    Returns:
        Formatted string showing where the asset is used
    """
    query = f"""
        SELECT
            asset.id,
            asset.name,
            asset.type,
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name,
            ad_group_ad.ad.id,
            ad_group_ad.ad.name
        FROM
            asset_link
        WHERE
            asset.id = '{asset_id}'
    """
    
    try:
        response = await execute_gaql_query(customer_id, query)
        
        if isinstance(response, str):
            return response
        
        results = response.get('results', [])
        if not results:
            return f"Asset with ID {asset_id} not found or not in use."
        
        # Prepare data structure
        first_result = results[0]
        asset_info = first_result.get('asset', {})
        asset_usage = {
            asset_id: {
                'name': asset_info.get('name', f"Asset {asset_id}"),
                'type': asset_info.get('type', 'N/A'),
                'usage': []
            }
        }
        
        output_lines = [f"Usage report for Asset ID: {asset_id}"]
        output_lines.append("=" * 80)
        
        # Collect usage details
        for result in results:
            asset = result.get('asset', {})
            asset_id = asset.get('id')
            
            if asset_id and asset_id in asset_usage:
                campaign = result.get('campaign', {})
                ad_group = result.get('adGroup', {})
                ad = result.get('adGroupAd', {}).get('ad', {}) if 'adGroupAd' in result else {}
                asset_link = result.get('assetLink', {})
                
                usage_info = {
                    'campaign_id': campaign.get('id', 'N/A'),
                    'campaign_name': campaign.get('name', 'N/A'),
                    'ad_group_id': ad_group.get('id', 'N/A'),
                    'ad_group_name': ad_group.get('name', 'N/A'),
                    'ad_id': ad.get('id', 'N/A') if ad else 'N/A',
                    'ad_name': ad.get('name', 'N/A') if ad else 'N/A'
                }
                
                asset_usage[asset_id]['usage'].append(usage_info)
        
        # Format the output
        for asset_id, info in asset_usage.items():
            output_lines.append(f"\nAsset ID: {asset_id}")
            output_lines.append(f"Name: {info['name']}")
            output_lines.append(f"Type: {info['type']}")
            
            if info['usage']:
                output_lines.append("\nUsed in:")
                output_lines.append("-" * 60)
                output_lines.append(f"{'Campaign':<30} | {'Ad Group':<30}")
                output_lines.append("-" * 60)
                
                for usage in info['usage']:
                    campaign_str = f"{usage['campaign_name']} ({usage['campaign_id']})"
                    ad_group_str = f"{usage['ad_group_name']} ({usage['ad_group_id']})"
                    
                    output_lines.append(f"{campaign_str[:30]:<30} | {ad_group_str[:30]:<30}")
            
            output_lines.append("=" * 80)
        
        return "\n".join(output_lines)
    
    except Exception as e:
        return f"Error retrieving asset usage: {str(e)}"

@mcp.tool()
async def analyze_image_assets(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'"),
    days: int = Field(default=30, description="Number of days to look back (7, 30, 90, etc.)")
) -> str:
    """
    Analyze image assets with their performance metrics across campaigns.
    
    This comprehensive tool helps you understand which image assets are performing well
    by showing metrics like impressions, clicks, and conversions for each image.
    
    RECOMMENDED WORKFLOW:
    1. First run list_accounts() to get available account IDs
    2. Then run get_account_currency() to see what currency the account uses
    3. Finally run this command to analyze image asset performance
    
    Args:
        customer_id: The Google Ads customer ID as a string (10 digits, no dashes)
        days: Number of days to look back (default: 30)
        
    Returns:
        Detailed report of image assets and their performance metrics
        
    Example:
        customer_id: "1234567890"
        days: 14
    """
    # Make sure to use a valid date range format
    # Valid formats are: LAST_7_DAYS, LAST_14_DAYS, LAST_30_DAYS, etc. (with underscores)
    if days == 7:
        date_range = "LAST_7_DAYS"
    elif days == 14:
        date_range = "LAST_14_DAYS"
    elif days == 30:
        date_range = "LAST_30_DAYS"
    else:
        # Default to 30 days if not a standard range
        date_range = "LAST_30_DAYS"
        
    query = f"""
        SELECT
            asset.id,
            asset.name,
            asset.image_asset.full_size.url,
            asset.image_asset.full_size.width_pixels,
            asset.image_asset.full_size.height_pixels,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros
        FROM
            campaign_asset
        WHERE
            asset.type = 'IMAGE'
            AND segments.date DURING LAST_30_DAYS
        ORDER BY
            metrics.impressions DESC
        LIMIT 200
    """
    
    try:
        creds = get_credentials()
        headers = get_headers(creds)
        
        formatted_customer_id = format_customer_id(customer_id)
        url = f"https://googleads.googleapis.com/{API_VERSION}/customers/{formatted_customer_id}/googleAds:search"
        
        payload = {"query": query}
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            return f"Error analyzing image assets: {response.text}"
        
        results = response.json()
        if not results.get('results'):
            return "No image asset performance data found for this customer ID and time period."
        
        # Group results by asset ID
        assets_data = {}
        for result in results.get('results', []):
            asset = result.get('asset', {})
            asset_id = asset.get('id')
            
            if asset_id not in assets_data:
                assets_data[asset_id] = {
                    'name': asset.get('name', f"Asset {asset_id}"),
                    'url': asset.get('imageAsset', {}).get('fullSize', {}).get('url', 'N/A'),
                    'dimensions': f"{asset.get('imageAsset', {}).get('fullSize', {}).get('widthPixels', 'N/A')} x {asset.get('imageAsset', {}).get('fullSize', {}).get('heightPixels', 'N/A')}",
                    'impressions': 0,
                    'clicks': 0,
                    'conversions': 0,
                    'cost_micros': 0,
                    'campaigns': set(),
                    'ad_groups': set()
                }
            
            # Aggregate metrics
            metrics = result.get('metrics', {})
            assets_data[asset_id]['impressions'] += int(metrics.get('impressions', 0))
            assets_data[asset_id]['clicks'] += int(metrics.get('clicks', 0))
            assets_data[asset_id]['conversions'] += float(metrics.get('conversions', 0))
            assets_data[asset_id]['cost_micros'] += int(metrics.get('costMicros', 0))
            
            # Add campaign and ad group info
            campaign = result.get('campaign', {})
            ad_group = result.get('adGroup', {})
            
            if campaign.get('name'):
                assets_data[asset_id]['campaigns'].add(campaign.get('name'))
            if ad_group.get('name'):
                assets_data[asset_id]['ad_groups'].add(ad_group.get('name'))
        
        # Format the results
        output_lines = [f"Image Asset Performance Analysis for Customer ID {formatted_customer_id} (Last {days} days):"]
        output_lines.append("=" * 100)
        
        # Sort assets by impressions (highest first)
        sorted_assets = sorted(assets_data.items(), key=lambda x: x[1]['impressions'], reverse=True)
        
        for asset_id, data in sorted_assets:
            output_lines.append(f"\nAsset ID: {asset_id}")
            output_lines.append(f"Name: {data['name']}")
            output_lines.append(f"Dimensions: {data['dimensions']}")
            
            # Calculate CTR if there are impressions
            ctr = (data['clicks'] / data['impressions'] * 100) if data['impressions'] > 0 else 0
            
            # Format metrics
            output_lines.append(f"\nPerformance Metrics:")
            output_lines.append(f"  Impressions: {data['impressions']:,}")
            output_lines.append(f"  Clicks: {data['clicks']:,}")
            output_lines.append(f"  CTR: {ctr:.2f}%")
            output_lines.append(f"  Conversions: {data['conversions']:.2f}")
            output_lines.append(f"  Cost (micros): {data['cost_micros']:,}")
            
            # Show where it's used
            output_lines.append(f"\nUsed in {len(data['campaigns'])} campaigns:")
            for campaign in list(data['campaigns'])[:5]:  # Show first 5 campaigns
                output_lines.append(f"  - {campaign}")
            if len(data['campaigns']) > 5:
                output_lines.append(f"  - ... and {len(data['campaigns']) - 5} more")
            
            # Add URL
            if data['url'] != 'N/A':
                output_lines.append(f"\nImage URL: {data['url']}")
            
            output_lines.append("-" * 100)
        
        return "\n".join(output_lines)
    
    except Exception as e:
        return f"Error analyzing image assets: {str(e)}"

@mcp.tool()
async def list_resources(
    customer_id: str = Field(description="Google Ads customer ID (10 digits, no dashes). Example: '9873186703'")
) -> str:
    """
    List valid resources that can be used in GAQL FROM clauses.
    
    Args:
        customer_id: The Google Ads customer ID as a string
        
    Returns:
        Formatted list of valid resources
    """
    # Example query that lists some common resources
    # This might need to be adjusted based on what's available in your API version
    query = """
        SELECT
            google_ads_field.name,
            google_ads_field.category,
            google_ads_field.data_type
        FROM
            google_ads_field
        WHERE
            google_ads_field.category = 'RESOURCE'
        ORDER BY
            google_ads_field.name
    """
    
    # Use your existing run_gaql function to execute this query
    return await run_gaql(customer_id, query)

@mcp.tool()
async def create_keyword(customer_id: str, ad_group_id: str, keyword_text: str, match_type: str) -> dict:
    """Creates a keyword in a specific ad group."""
    creds = get_credentials()
    headers = get_headers(creds)
    
    formatted_customer_id = format_customer_id(customer_id)
    url = f"https://googleads.googleapis.com/{API_VERSION}/customers/{formatted_customer_id}/adGroupCriteria:mutate"

    match_type_enum = "UNSPECIFIED"
    if match_type.lower() == 'broad':
        match_type_enum = 'BROAD'
    elif match_type.lower() == 'phrase':
        match_type_enum = 'PHRASE'
    elif match_type.lower() == 'exact':
        match_type_enum = 'EXACT'

    payload = {
        'operations': [
            {
                'create': {
                    'adGroup': f'customers/{formatted_customer_id}/adGroups/{ad_group_id}',
                    'type': 'KEYWORD',
                    'keyword': {
                        'text': keyword_text,
                        'matchType': match_type_enum
                    }
                }
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error creating keyword: {response.text}")

@mcp.tool()
async def sync_keywords_from_csv(customer_id: str, campaign_name: str) -> str:
    """Syncs keywords from keywords.csv to a specified campaign in Google Ads."""
    keywords_file = os.path.join(os.path.dirname(__file__), 'keywords.csv')
    try:
        df = pd.read_csv(keywords_file)
        # Filter for the specified campaign
        campaign_df = df[df['campaign'].str.lower() == campaign_name.lower()]

        if campaign_df.empty:
            return f"No keywords found for campaign '{campaign_name}' in {keywords_file}"

        # Get ad groups for the campaign
        gaql_query = f"SELECT ad_group.id, ad_group.name FROM ad_group WHERE campaign.name = '{campaign_name}'"
        ad_groups_response = await execute_gaql_query(customer_id, gaql_query)
        if isinstance(ad_groups_response, str):
            return f"Error fetching ad groups: {ad_groups_response}"

        ad_groups_map = {ag['adGroup']['name']: ag['adGroup']['id'] for ag in ad_groups_response.get('results', [])}

        results_summary = []
        for index, row in campaign_df.iterrows():
            ad_group_name = row['ad_group']
            keyword_text = row['keyword']
            match_type = row['match_type']

            if ad_group_name in ad_groups_map:
                ad_group_id = ad_groups_map[ad_group_name]
                try:
                    result = await create_keyword(customer_id, ad_group_id, keyword_text, match_type)
                    results_summary.append(f"Successfully created keyword '{keyword_text}' in ad group '{ad_group_name}'.")
                except Exception as e:
                    results_summary.append(f"Failed to create keyword '{keyword_text}': {e}")
            else:
                results_summary.append(f"Ad group '{ad_group_name}' not found in campaign '{campaign_name}'.")
        
        return "\n".join(results_summary)

    except FileNotFoundError:
        return f"Error: The file {keywords_file} was not found."
    except Exception as e:
        return f"An error occurred: {e}"

@mcp.tool()
async def manage_keywords_from_csv(action: str = 'list', data: dict = None) -> str:
    """Manages keywords from a local keywords.csv file.

    Args:
        action (str): The action to perform. Can be 'list'.
        data (dict): The data to use for the action (not used for 'list').
    """
    keywords_file = os.path.join(os.path.dirname(__file__), 'keywords.csv')
    try:
        df = pd.read_csv(keywords_file)
        if action == 'list':
            return df.to_json(orient='records')
        else:
            return f"Action '{action}' is not supported."
    except FileNotFoundError:
        return f"Error: The file {keywords_file} was not found."
    except Exception as e:
        return f"An error occurred: {e}"

if __name__ == "__main__":
    mcp.run(transport="stdio")
