import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Simple dotenv parser
const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
for (const line of envFile.split("\n")) {
    if (line.includes("=")) {
        const [key, ...rest] = line.split("=");
        process.env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
    // skip profiles, ENUM already rejects 'developer'

    // Now update auth.users
    console.log("Fetching users with role developer in metadata...");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
         console.error("Error listing auth users:", error);
         return;
    }

    let updatedAuth = 0;
    for (const user of data.users) {
        let needsUpdate = false;
        const meta = { ...user.user_metadata };
        const appMeta = { ...user.app_metadata };

        if (meta?.role === "developer") {
            meta.role = "super-admin";
            needsUpdate = true;
        }

        if (appMeta?.role === "developer") {
            appMeta.role = "super-admin";
            needsUpdate = true;
        }
        
        // Check job_title as well just in case
        if (meta?.job_title === "Developer" || meta?.job_title === "developer") {
            meta.job_title = "Super Admin";
            needsUpdate = true;
        }

        if (needsUpdate) {
            const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: meta,
                app_metadata: appMeta,
            });

            if (updateErr) {
                console.error(`Failed to update auth for user ${user.id}:`, updateErr);
            } else {
                updatedAuth++;
            }
        }
    }
    console.log(`Updated ${updatedAuth} auth users.`);
}

migrate();
