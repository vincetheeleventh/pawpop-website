---
title: "Google Ads Integration"
date: 2025-08-19
author: "Cascade"
version: "v1.0.0"
status: "draft"
---

# Google Ads Integration Workflow

## 1. Overview

This document outlines the workflow for integrating and managing Google Ads campaigns for the Pawpop project using a custom Model Context Protocol (MCP) server. This integration allows for programmatic management of ad campaigns, with a focus on keyword strategies defined in a local CSV file.

## 2. Architecture

The integration consists of the following components:

-   **Google Ads MCP Server**: A Python-based server located in `src/mcp/google-ads/` that connects to the Google Ads API.
-   **`keywords.csv`**: A CSV file located in `src/mcp/google-ads/` that defines the keyword strategy, including campaigns, ad groups, keywords, and match types.
-   **`.env` file**: A configuration file in `src/mcp/google-ads/` that securely stores API credentials and other environment variables.
-   **Python Virtual Environment**: An isolated environment in `src/mcp/google-ads/.venv/` containing all necessary Python dependencies.

## 3. Key Decisions

-   **Authentication**: We are using a **Service Account** for authentication. This method is ideal for server-to-server interactions, enabling automated and secure access to the Google Ads API without requiring manual user intervention.
-   **Keyword Management**: Keywords are managed via a `keywords.csv` file. This approach allows for easy bulk updates and version control of keyword strategies.
-   **Isolated Environment**: All Python dependencies are managed within a virtual environment to avoid conflicts with other parts of the Pawpop project.

## 4. Usage & API

The MCP server exposes several tools for interacting with the Google Ads API. Key tools include:

-   `list_accounts()`: Lists all accessible Google Ads accounts.
-   `get_campaign_performance(customer_id, days)`: Retrieves performance metrics for all campaigns in an account.
-   `sync_keywords_from_csv(customer_id, campaign_name)`: Synchronizes keywords from the `keywords.csv` file to a specified campaign in Google Ads.

### Example Workflow:

1.  **Update Keywords**: Modify the `src/mcp/google-ads/keywords.csv` file to add, remove, or change keywords.
2.  **Run Synchronization**: Use the `sync_keywords_from_csv` tool with your `customer_id` and the target `campaign_name` to apply the changes to your Google Ads account.

## 5. Dependencies

-   **Python 3.11+**
-   **Google Ads API client libraries** (`google-ads`, `google-auth-oauthlib`, etc.)
-   **Pandas**: For reading and processing the `keywords.csv` file.

## 6. Test Coverage

-   Manual testing of the MCP server has been performed to verify authentication and basic API connectivity.
-   The `sync_keywords_from_csv` tool has been implemented but requires end-to-end testing with a live Google Ads account.

## 7. Changelog

-   **2025-08-19**: Initial draft of the integration documentation.
