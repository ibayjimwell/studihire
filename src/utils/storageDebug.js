/**
 * Storage Diagnostic Tool
 * Helps debug Supabase storage issues
 */

import supabase from "@/lib/supabaseClient";

export const diagnosticStorageIssues = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    auth: null,
    buckets: null,
    permissions: null,
    recommendations: [],
  };

  try {
    // 1. Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    diagnostics.auth = {
      isAuthenticated: !!session,
      user: session?.user?.email || "anonymous",
      hasSession: !!session,
    };

    // 2. List all buckets
    try {
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (bucketsError) {
        diagnostics.buckets = {
          error: bucketsError.message,
          buckets: [],
        };
        diagnostics.recommendations.push(
          `Bucket listing failed: ${bucketsError.message}`,
        );
      } else {
        const bucketNames = buckets.map((b) => b.name);
        diagnostics.buckets = {
          found: bucketNames,
          missing: [
            !bucketNames.includes("student-resumes") ? "student-resumes" : null,
            !bucketNames.includes("student-ids") ? "student-ids" : null,
          ].filter(Boolean),
        };

        if (diagnostics.buckets.missing.length > 0) {
          diagnostics.recommendations.push(
            `Missing buckets: ${diagnostics.buckets.missing.join(", ")}. These need to be created.`,
          );
        }
      }
    } catch (err) {
      diagnostics.buckets = { error: err.message };
      diagnostics.recommendations.push(`Storage API error: ${err.message}`);
    }

    // 3. Test upload permissions
    try {
      const testFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });
      const testPath = `test/${Date.now()}/test.txt`;

      // Try upload to first available bucket
      const testBucket = diagnostics.buckets?.found?.[0];

      if (testBucket) {
        const { error: uploadError } = await supabase.storage
          .from(testBucket)
          .upload(testPath, testFile, { upsert: true });

        diagnostics.permissions = {
          canUpload: !uploadError,
          uploadError: uploadError?.message,
          testBucket,
        };

        if (uploadError) {
          diagnostics.recommendations.push(
            `Upload permission denied on ${testBucket}: ${uploadError.message}`,
          );

          // Check if it's an RLS issue
          if (
            uploadError.message?.includes("policy") ||
            uploadError.message?.includes("permission")
          ) {
            diagnostics.recommendations.push(
              "This is an RLS (Row Level Security) policy issue. Check bucket policies in Supabase.",
            );
          }
        } else {
          // Clean up test file
          await supabase.storage.from(testBucket).remove([testPath]);
        }
      }
    } catch (err) {
      diagnostics.permissions = { error: err.message };
      diagnostics.recommendations.push(
        `Permission test failed: ${err.message}`,
      );
    }

    // 4. Generate recommendations
    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push(
        "✅ Storage appears to be configured correctly",
      );
    }

    console.log("=== STORAGE DIAGNOSTIC REPORT ===");
    console.log(JSON.stringify(diagnostics, null, 2));

    return diagnostics;
  } catch (error) {
    console.error("Diagnostic error:", error);
    return {
      error: error.message,
      recommendations: [
        "An unexpected error occurred during diagnostics. Check browser console.",
      ],
    };
  }
};

/**
 * Fix common storage issues
 */
export const fixStorageIssues = async () => {
  const fixes = {
    applied: [],
    failed: [],
  };

  try {
    // 1. Create missing buckets
    const bucketConfigs = [
      { name: "student-resumes", public: true },
      { name: "student-ids", public: true },
    ];

    for (const config of bucketConfigs) {
      try {
        // Check if bucket exists
        const { data: bucket } = await supabase.storage.getBucket(config.name);

        if (!bucket) {
          // Create if missing
          await supabase.storage.createBucket(config.name, {
            public: config.public,
          });
          fixes.applied.push(`Created bucket: ${config.name}`);
        } else {
          fixes.applied.push(`Bucket already exists: ${config.name}`);
        }
      } catch (err) {
        // getBucket throws if not exists, try creating anyway
        try {
          await supabase.storage.createBucket(config.name, {
            public: config.public,
          });
          fixes.applied.push(`Created bucket: ${config.name}`);
        } catch (createErr) {
          fixes.failed.push({
            bucket: config.name,
            error: createErr.message,
          });
        }
      }
    }

    console.log("=== STORAGE FIX REPORT ===");
    console.log("Applied:", fixes.applied);
    console.log("Failed:", fixes.failed);

    return fixes;
  } catch (error) {
    console.error("Fix error:", error);
    return {
      applied: [],
      failed: [{ general: error.message }],
    };
  }
};
