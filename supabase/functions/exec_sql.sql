-- exec_sql function for migration manager
-- This function allows the migration system to execute SQL commands
-- SECURITY: Only accessible via service role key

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Security check: Only allow service role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: exec_sql requires service role';
    END IF;
    
    -- Execute the SQL
    EXECUTE sql_query;
    
    -- Return success message
    result := 'SQL executed successfully';
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with context
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Revoke from other roles for security
REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM anon, authenticated;
