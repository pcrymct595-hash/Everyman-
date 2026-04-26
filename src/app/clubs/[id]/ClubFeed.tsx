"use client";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function ClubFeed({ clubId, isMember, currentUserId }: { clubId: string; isMember: boolean; currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPosts() {
    const res = await fetch(`/api/clubs/${clubId}/posts`);
    if (res.ok) setPosts(await res.json());
  }

  useEffect(() => { loadPosts(); }, [clubId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch(`/api/clubs/${clubId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    await loadPosts();
    setLoading(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Discussion</h2>

      {isMember && (
        <form onSubmit={handlePost} className="mb-5">
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white resize-none mb-2"
          />
          <button
            type="submit" disabled={loading || !content.trim()}
            className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm">No posts yet. {isMember ? "Be the first!" : "Join the club to post."}</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold text-amber-100">
                  {(post.user.name ?? post.user.email)[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-300">{post.user.name ?? post.user.email}</span>
                <span className="text-xs text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
