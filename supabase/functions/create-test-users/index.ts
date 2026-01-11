import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const testUsers = [
  {
    email: "rajesh.sharma@test.com",
    password: "Test@123",
    full_name: "Rajesh Kumar Sharma",
    business_name: "Sharma Textiles",
    phone: "9876543210",
    address: "45, Gandhi Road, Cloth Market, Indore, MP 452001",
    gst_number: "23AABCS1234F1ZK",
    credit_limit: 75000
  },
  {
    email: "amit.patel@test.com",
    password: "Test@123",
    full_name: "Amit Patel",
    business_name: "Patel & Sons Fabrics",
    phone: "9823456789",
    address: "12, Ring Road, Textile Hub, Ahmedabad, Gujarat 380001",
    gst_number: "24AABCP5678G2ZL",
    credit_limit: 100000
  },
  {
    email: "suresh.agarwal@test.com",
    password: "Test@123",
    full_name: "Suresh Agarwal",
    business_name: "Agarwal Cloth House",
    phone: "9912345678",
    address: "78, Sadar Bazaar, Near Clock Tower, Nagpur, Maharashtra 440001",
    gst_number: "27AABCA9012H3ZM",
    credit_limit: 50000
  },
  {
    email: "priya.jain@test.com",
    password: "Test@123",
    full_name: "Priya Jain",
    business_name: "Jain Fashion Fabrics",
    phone: "9834567890",
    address: "23, MG Road, Udaipur, Rajasthan 313001",
    gst_number: "08AABCJ3456I4ZN",
    credit_limit: 60000
  },
  {
    email: "vikram.singh@test.com",
    password: "Test@123",
    full_name: "Vikram Singh Rathore",
    business_name: "Royal Fabrics Pvt Ltd",
    phone: "9945678901",
    address: "56, Industrial Area, Phase 2, Jaipur, Rajasthan 302001",
    gst_number: "08AABCR7890J5ZO",
    credit_limit: 150000
  },
  {
    email: "deepak.gupta@test.com",
    password: "Test@123",
    full_name: "Deepak Gupta",
    business_name: "Gupta Brothers Trading",
    phone: "9856789012",
    address: "34, Nehru Nagar, Main Market, Bhopal, MP 462001",
    gst_number: "23AABCG1234K6ZP",
    credit_limit: 80000
  },
  {
    email: "meena.agrawal@test.com",
    password: "Test@123",
    full_name: "Meena Devi Agrawal",
    business_name: "Agrawal Saree Center",
    phone: "9867890123",
    address: "89, Sarafa Bazaar, Near Rajwada, Indore, MP 452001",
    gst_number: "23AABCA5678L7ZQ",
    credit_limit: 45000
  },
  {
    email: "rahul.mehta@test.com",
    password: "Test@123",
    full_name: "Rahul Mehta",
    business_name: "Mehta Cloth Emporium",
    phone: "9878901234",
    address: "67, Station Road, Textile Market, Surat, Gujarat 395001",
    gst_number: "24AABCM9012M8ZR",
    credit_limit: 120000
  },
  {
    email: "anita.bansal@test.com",
    password: "Test@123",
    full_name: "Anita Bansal",
    business_name: "Bansal Fabrics International",
    phone: "9889012345",
    address: "12, Export Zone, Panipat, Haryana 132103",
    gst_number: "06AABCB3456N9ZS",
    credit_limit: 200000
  },
  {
    email: "karan.choudhary@test.com",
    password: "Test@123",
    full_name: "Karan Choudhary",
    business_name: "Choudhary Textile Mills",
    phone: "9890123456",
    address: "45, MIDC Area, Ichalkaranji, Maharashtra 416115",
    gst_number: "27AABCC7890O0ZT",
    credit_limit: 90000
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting test user creation...");

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = [];

    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}`);
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          business_name: user.business_name,
          phone: user.phone
        }
      });

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message);
        results.push({ email: user.email, success: false, error: authError.message });
        continue;
      }

      console.log(`Auth user created: ${authData.user?.id}`);

      // Update profile with additional details (trigger creates basic profile)
      if (authData.user) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            address: user.address,
            gst_number: user.gst_number,
            credit_limit: user.credit_limit,
            phone: user.phone,
            business_name: user.business_name
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error(`Error updating profile for ${user.email}:`, profileError.message);
          results.push({ 
            email: user.email, 
            success: true, 
            userId: authData.user.id,
            profileUpdated: false,
            error: profileError.message 
          });
        } else {
          console.log(`Profile updated for ${user.email}`);
          results.push({ 
            email: user.email, 
            success: true, 
            userId: authData.user.id,
            profileUpdated: true 
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${testUsers.length} users created`);

    return new Response(
      JSON.stringify({
        message: `Created ${successCount} out of ${testUsers.length} test users`,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in create-test-users:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
