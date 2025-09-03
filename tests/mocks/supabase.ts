// Mock Supabase client for testing
export const mockSupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      }),
      data: [],
      error: null
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ 
          data: { 
            id: 'test-id', 
            access_token: 'test-token',
            generation_status: 'pending' 
          }, 
          error: null 
        })
      })
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
};

// Mock the Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));
