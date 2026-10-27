"use client";

import { useMemo, useState } from "react";
import type { Board } from "@/lib/data";
import BoardTabs from "@/components/BoardTabs";
import Leaderboard from "@/components/Leaderboard";
import ValueScatter from "@/components/ValueScatter";

interface Props {
  boards: Board[];
  defaultKey: string;
}

export default function LeaderboardShell({ boards, defaultKey }: Props) {
  const [activeKey, setActiveKey] = useState(defaultKey);
  const active = useMemo(
    () => boards.find((b) => b.key === activeKey) ?? boards[0],
    [boards, activeKey],
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <BoardTabs
          boards={boards.map((b) => ({ key: b.key, label: b.label, count: b.entries.length }))}
          activeKey={active.key}
          onSelect={setActiveKey}
        />
      </div>

      <Leaderboard entries={active.entries} />

      <section className="mt-8">
        <ValueScatter entries={boards.find((b) => b.key === "overall")?.entries ?? active.entries} />
      </section>
    </>
  );
}
