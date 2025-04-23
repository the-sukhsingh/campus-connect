export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">You are offline</h1>
      <p className="text-lg mb-6">
        Please check your internet connection and try again.
      </p>
      <p className="text-md">
        The SCSRK Campus Portal requires an internet connection to access most features.
      </p>
    </div>
  );
}