// src/components/chat/SharedMediaModal.jsx
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import messageService from "../../services/messageService";
import EmptyState from "../ui/EmptyState";
import { Image as ImageIcon } from "lucide-react";

export default function SharedMediaModal({ open, onClose, userId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    messageService
      .getSharedMedia(userId)
      .then((data) => setMedia(data.media ?? []))
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <Modal open={open} onClose={onClose} title="Shared media" className="max-w-lg">
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-lg" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={24} />}
          title="No shared media yet"
          description="Images you exchange will show up here."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto scroll-thin">
          {media.map((m) => (
            <a
              key={m._id}
              href={m.media}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden bg-elevated"
            >
              <img src={m.media} alt="Shared" className="w-full h-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}
    </Modal>
  );
}
