// src/components/group/CreateGroupModal.jsx
import { useState } from "react";
import { Camera, X, Search } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import userService from "../../services/userService";
import { fileToBase64, validateImageFile } from "../../utils/fileToBase64";
import { toast } from "../../context/UiContext";

export default function CreateGroupModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setAvatarPreview(null);
    setAvatarBase64(null);
    setQuery("");
    setResults([]);
    setSelected([]);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error } = validateImageFile(file);
    if (!valid) return toast.error(error);
    const base64 = await fileToBase64(file);
    setAvatarBase64(base64);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) return setResults([]);
    const data = await userService.search(val.trim());
    setResults(data.users ?? []);
  };

  const toggleMember = (user) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Group name is required");
    setCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        memberIds: selected.map((u) => u._id),
        avatar: avatarBase64,
      });
      reset();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create group"
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer">
            <Avatar src={avatarPreview} name={name || "G"} size={64} />
            <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1.5">
              <Camera size={12} />
            </div>
            <input type="file" accept="image/*" hidden onChange={handleAvatarSelect} />
          </label>
          <div className="flex-1 space-y-2">
            <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-ink-dim mb-2">Add members</p>
          <Input
            icon={<Search size={16} />}
            placeholder="Search by name, username, or email"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {results.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto scroll-thin border border-border rounded-xl">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => toggleMember(user)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-elevated/60 transition-colors text-left"
                >
                  <Avatar src={user.profilePic} name={user.fullName} size={28} />
                  <span className="text-sm flex-1 truncate">{user.fullName}</span>
                  <input
                    type="checkbox"
                    readOnly
                    checked={selected.some((u) => u._id === user._id)}
                    className="accent-accent"
                  />
                </button>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selected.map((user) => (
                <span
                  key={user._id}
                  className="flex items-center gap-1.5 bg-elevated rounded-full pl-1 pr-2 py-1 text-xs"
                >
                  <Avatar src={user.profilePic} name={user.fullName} size={18} />
                  {user.fullName}
                  <button onClick={() => toggleMember(user)} className="text-ink-dim hover:text-danger">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg" isLoading={creating}>
          Create group
        </Button>
      </div>
    </Modal>
  );
}
