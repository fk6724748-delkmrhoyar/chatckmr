import React, { useRef, useState } from "react";
import { useAppStore } from "../lib/store";
import { UserProfile } from "../lib/types";
import {
  ArrowLeft,
  BadgeCheck,
  Send,
  ImagePlus,
  Trash2,
  Users,
  MoreVertical,
  Megaphone,
} from "lucide-react";
import { format } from "date-fns";

export default function ChannelView({
  currentUser,
  channelId,
}: {
  currentUser: UserProfile;
  channelId: string;
}) {
  const {
    channels,
    channelPosts,
    addChannelPost,
    deleteChannelPost,
    toggleFollowChannel,
    deleteChannel,
    updateChannel,
    setSidebarOpen,
    setCurrentChannelId,
  } = useAppStore();

  const channel = channels.find((c) => c.id === channelId);
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  if (!channel) return null;

  const isOwner = channel.ownerId === currentUser.uid || !!currentUser.isAdmin;
  const isFollowing = channel.followers.includes(currentUser.uid);
  const posts = channelPosts
    .filter((p) => p.channelId === channelId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      addChannelPost(channelId, "", "image", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      updateChannel(channelId, { avatarUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const avatar =
    channel.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=6a4cff&color=fff`;

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2] dark:bg-[#0b141a] relative">
      <div className="h-[60px] bg-white dark:bg-[#0b141a] px-4 flex items-center justify-between border-b border-[#f0f2f5] dark:border-[#202c33] shrink-0 z-20">
        <div className="flex items-center flex-1 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#111b21] dark:text-white mr-3"
          >
            <ArrowLeft size={24} />
          </button>
          <img
            src={avatar}
            onClick={() => isOwner && avatarRef.current?.click()}
            className={`w-10 h-10 rounded-full object-cover mr-3 shrink-0 ${isOwner ? "cursor-pointer" : ""}`}
          />
          <input
            type="file"
            accept="image/*"
            hidden
            ref={avatarRef}
            onChange={handleAvatar}
          />
          <div className="truncate">
            <h3 className="text-[17px] font-medium text-[#111b21] dark:text-[#e9edef] flex items-center gap-1">
              {channel.name}
              {channel.isVerified && (
                <BadgeCheck size={16} className="text-white fill-[#1da1f2] shrink-0" />
              )}
            </h3>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] truncate flex items-center gap-1">
              <Users size={12} /> {channel.followers.length} followers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[#54656f] dark:text-white relative">
          <button
            onClick={() => toggleFollowChannel(channelId)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ${isFollowing ? "bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1]" : "bg-[#25d366] text-[#0b141a]"}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={22} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#233138] shadow-xl rounded-2xl overflow-hidden z-50 py-2 border border-gray-100 dark:border-[#313d45]">
              <div className="px-5 py-2 text-[12px] text-[#667781] dark:text-[#8696a0]">
                {channel.about || "No description"}
              </div>
              {isOwner && (
                <button
                  onClick={() => {
                    deleteChannel(channelId);
                    setCurrentChannelId(null);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] flex items-center gap-3 text-red-500 text-[15px]"
                >
                  <Trash2 size={18} /> Delete channel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="self-center bg-[#d1f4ff] dark:bg-[#182229] px-3 py-1 rounded-lg text-[11px] text-[#54656f] dark:text-[#8696a0] uppercase">
          Channel created {format(new Date(channel.createdAt), "PP")}
        </div>
        {posts.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[#667781] dark:text-[#8696a0] gap-3">
            <Megaphone size={40} />
            <p className="text-sm max-w-xs">
              No updates yet. {isOwner ? "Share your first update below." : "Follow to get updates."}
            </p>
          </div>
        )}
        {posts.map((p) => (
          <div
            key={p.id}
            className="self-start max-w-[85%] bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none shadow-sm p-2 relative group"
          >
            {p.mediaUrl && (
              <img src={p.mediaUrl} className="rounded-md mb-1 max-w-[300px]" />
            )}
            {p.text && (
              <div className="text-[14.2px] text-[#111b21] dark:text-[#e9edef] px-1 break-words">
                {p.text}
              </div>
            )}
            <div className="text-[11px] text-[#667781] dark:text-[#ffffff99] text-right px-1 mt-1">
              {format(new Date(p.createdAt), "HH:mm")}
            </div>
            {isOwner && (
              <button
                onClick={() => deleteChannelPost(p.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner ? (
        <div className="bg-white dark:bg-[#0b141a] px-2 py-2 flex items-center gap-2 shrink-0">
          <div className="flex-1 bg-[#f0f2f5] dark:bg-[#202c33] rounded-[24px] flex items-center px-3 py-1 min-h-[44px]">
            <button onClick={() => fileRef.current?.click()} className="text-[#54656f] dark:text-[#aebac1]">
              <ImagePlus size={22} />
            </button>
            <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleMedia} />
            <form
              className="flex-1 mx-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                addChannelPost(channelId, text);
                setText("");
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share an update"
                className="w-full bg-transparent outline-none text-[16px] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0]"
              />
            </form>
          </div>
          <button
            onClick={() => {
              if (!text.trim()) return;
              addChannelPost(channelId, text);
              setText("");
            }}
            className="w-[44px] h-[44px] bg-[#25d366] rounded-full flex items-center justify-center text-white shrink-0"
          >
            <Send size={20} className="translate-x-0.5" />
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0b141a] py-4 text-center text-[13px] text-[#667781] dark:text-[#8696a0] shrink-0">
          📢 Only the channel owner can post here
        </div>
      )}
    </div>
  );
}
