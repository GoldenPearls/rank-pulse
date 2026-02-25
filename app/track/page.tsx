import { Suspense } from "react";
import TrackClient from "./TrackClient";

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <TrackClient />
    </Suspense>
  );
}
