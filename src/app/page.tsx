import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div>
        <h2 className="text-2xl font-semibold text-center border p-4 font-mono rounded-md">
          Starter Template
        </h2>
      </div>
      <div>
        <h1 className="text-6xl font-bold text-center">3, 2, 1... Go!</h1>
        <h2 className="text-2xl text-center font-light text-gray-500 pt-4">
          This page will be replaced with your app.
        </h2>
      </div>
      
    </main>
  );
}
