import { PinDetail } from "@/components/pin/PinDetail";

export default async function PinPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    return <PinDetail id={username} />;
}