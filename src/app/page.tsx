"use client";

import { useState } from "react";
import ImageChannelSplitter from "@/components/imagechannelsplitter";
import ImageChannelCombiner from "@/components/imagechannelcombiner";

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<
    "splitter" | "combiner"
  >("splitter");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center py-8 px-8 bg-white dark:bg-black">
        {/* Component Switcher */}
        <div className="w-full max-w-md mb-6">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveComponent("splitter")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === "splitter"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Channel Splitter
            </button>
            <button
              onClick={() => setActiveComponent("combiner")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === "combiner"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Channel Combiner
            </button>
          </div>
        </div>

        {/* Active Component */}
        <div className="w-full max-w-4xl flex justify-center">
          <div className="w-full">
            {activeComponent === "splitter" && <ImageChannelSplitter />}
            {activeComponent === "combiner" && <ImageChannelCombiner />}
          </div>
        </div>
      </main>
    </div>
  );
}

