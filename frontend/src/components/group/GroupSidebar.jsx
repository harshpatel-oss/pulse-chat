// src/components/group/GroupSidebar.jsx
import { Plus, Users } from "lucide-react";
import { useGroup } from "../../context/GroupContext";
import GroupListItem from "./GroupListItem";
import { SidebarItemSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

export default function GroupSidebar({ onSelect, activeId, onCreate }) {
  const { groups, isLoadingGroups } = useGroup();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Groups</h1>
        <button
          onClick={onCreate}
          className="p-2 rounded-full bg-accent text-white hover:bg-accent-dim transition-colors shadow-md shadow-accent/20"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {isLoadingGroups ? (
          Array.from({ length: 5 }).map((_, i) => <SidebarItemSkeleton key={i} />)
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No groups yet"
            description="Create a group to start chatting with multiple people."
          />
        ) : (
          groups.map((group) => (
            <GroupListItem
              key={group._id}
              group={group}
              isActive={activeId === group._id}
              onClick={() => onSelect(group._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
