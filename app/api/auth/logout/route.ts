import { fail, ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return fail("AUTH_ERROR", "Gagal logout.", 500, error.message);
    }

    const response = ok(null, "Logout berhasil.");

    response.cookies.set("sb-mhfdzprxauqfczmtyizg-auth-token", "", {
      expires: new Date(0),
      path: "/",
      domain: ".lvh.me",
    });
    response.cookies.set("sb-mhfdzprxauqfczmtyizg-auth-token", "", {
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("role", "", {
      expires: new Date(0),
      path: "/",
      domain: ".lvh.me",
    });
    response.cookies.set("role", "", {
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      [400, 404, 500].includes((error as { status: number }).status)
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json(
      { success: false, error: { message } },
      { status }
    );
  }
}
