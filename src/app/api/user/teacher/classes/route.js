import { NextResponse } from "next/server";
import { createClass, getClassesByTeacher } from "@/services/classService";
import { getUserByFirebaseUid } from "@/services/userService";


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

        if (!uid) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }


        const data = await getClassesByTeacher(uid);

        if (!data) {
            throw new Error("Failed to fetch data from the API");
        }

        return NextResponse.json(data);
    } catch (error ) {
        console.error("Error fetching data:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch data" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try{
        const {firebaseUid, collegeId, classData} = await request.json();

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }
        const user = await getUserByFirebaseUid(firebaseUid);
        const userId = user?._id?.toString() || null;
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (user.role !== "faculty" && user.role !== "hod") {
            return NextResponse.json(
                { error: "Unauthorized. Only teachers can access this endpoint" },
                { status: 403 }
            );
        }

        const result = await createClass(
            userId,
            collegeId,
            classData
        );

        if (!result) {
            return NextResponse.json(
                { error: "Failed to create class" },
                { status: 500 }
            );
        }

        return NextResponse.json({class: result});

    } catch (error ) {
        console.error("Error creating class:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create class" },
            { status: 500 }
        );
    }
}