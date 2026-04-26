import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3 text-amber-400">🎬 Everyman Film Club</h1>
        <p className="text-xl text-gray-400 max-w-md">
          Create film clubs, invite friends, host watch parties and discuss films together.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/auth/login" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors">
          Sign In
        </Link>
        <Link href="/auth/register" className="px-6 py-3 border border-gray-600 hover:border-amber-400 text-gray-300 hover:text-amber-400 font-semibold rounded-lg transition-colors">
          Create Account
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-left">
        {[
          { icon: "🎭", title: "Film Clubs", desc: "Create public or private clubs around your favourite genres" },
          { icon: "🍿", title: "Watch Parties", desc: "Host watch parties with YouTube, podcasts, or social events" },
          { icon: "💬", title: "Discuss & Share", desc: "Post reviews, share thoughts and invite friends" },
        ].map((f) => (
          <div key={f.title} className="p-5 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold mb-1 text-amber-300">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
