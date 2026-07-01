// src/components/group/GroupDetailsPanel.jsx
import { useState } from "react";
import { Crown, UserMinus, UserPlus, LogOut, Trash2, Search } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useGroup } from "../../context/GroupContext";
import { toast } from "../../context/UiContext";

export default function GroupDetailsPanel({ open, onClose, group, onLeave, onDelete }) {
  const { user: currentUser } = useAuth();
  const { addMember, removeMember, promoteAdmin } = useGroup();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  if (!group) return null;

  const isAdmin = group.admins?.some((a) => (a._id ?? a) === currentUser?._id);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) return setResults([]);
    const data = await userService.search(val.trim());
    const existingIds = new Set(group.members.map((m) => m._id ?? m));
    setResults((data.users ?? []).filter((u) => !existingIds.has(u._id)));
  };

  const handleAdd = async (userId) => {
    setBusy(true);
    try {
      await addMember(group._id, userId);
      toast.success("Member added");
      setQuery("");
      setResults([]);
    } catch (error) {
      // Only show error if it's not a 401 (which gets retried automatically)
      if (error.response?.status !== 401) {
        toast.error(error.message || "Failed to add member");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId) => {
    setBusy(true);
    try {
      await removeMember(group._id, userId);
      toast.success("Member removed");
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.message || "Failed to remove member");
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePromote = async (userId) => {
    setBusy(true);
    try {
      await promoteAdmin(group._id, userId);
      toast.success("Promoted to admin");
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.message || "Failed to promote member");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={group.name} className="max-w-lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={group.avatar} name={group.name} size={56} />
          <div>
            <p className="font-medium">{group.name}</p>
            <p className="text-xs text-ink-dim">{group.description || "No description"}</p>
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="text-sm font-medium text-ink-dim mb-2">Add members</p>
            <Input
              icon={<Search size={16} />}
              placeholder="Search people"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto scroll-thin border border-border rounded-xl">
                {results.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleAdd(user._id)}
                    disabled={busy}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-elevated/60 transition-colors text-left"
                  >
                    <Avatar src={user.profilePic} name={user.fullName} size={26} />
                    <span className="text-sm flex-1 truncate">{user.fullName}</span>
                    <UserPlus size={14} className="text-accent" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-ink-dim mb-2">
            {group.members?.length ?? 0} members
          </p>
          <div className="space-y-1 max-h-56 overflow-y-auto scroll-thin">
            {group.members?.map((member) => {
              const memberId = member._id ?? member;
              const memberIsAdmin = group.admins?.some((a) => (a._id ?? a) === memberId);
              return (
                <div
                  key={memberId}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-elevated/40"
                >
                  <Avatar src={member.profilePic} name={member.fullName} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate flex items-center gap-1">
                      {member.fullName}
                      {memberIsAdmin && <Crown size={12} className="text-warn" />}
                    </p>
                  </div>
                  {isAdmin && memberId !== currentUser?._id && (
                    <div className="flex items-center gap-1">
                      {!memberIsAdmin && (
                        <button
                          onClick={() => handlePromote(memberId)}
                          title="Promote to admin"
                          className="p-1.5 text-ink-dim hover:text-accent rounded-full hover:bg-elevated"
                        >
                          <Crown size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(memberId)}
                        title="Remove member"
                        className="p-1.5 text-ink-dim hover:text-danger rounded-full hover:bg-elevated"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onLeave}>
            <LogOut size={15} /> Leave group
          </Button>
          {isAdmin && (
            <Button variant="danger" className="flex-1" onClick={onDelete}>
              <Trash2 size={15} /> Delete group
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
