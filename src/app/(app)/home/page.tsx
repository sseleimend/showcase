"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Video } from "../../../../generated/prisma";
import VideoCard from "@/components/VideoCard";

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get("/api/videos");
      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch {
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bolf mb-4">
        {videos.length === 0 ? (
          <div className="text-center text-lg text-gray-500">
            No videos available
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </h1>
    </div>
  );
}
