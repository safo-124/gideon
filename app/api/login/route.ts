import { NextResponse } from "next/server";
import { authenticateTenantLogin } from "@/app/login/authenticate";

export async function POST(request: Request) {
  try {
    const result = await authenticateTenantLogin(await request.formData());

    return NextResponse.json(result, { status: result.unlocked ? 200 : 400 });
  } catch (error) {
    console.error("[login] tenant login failed:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
