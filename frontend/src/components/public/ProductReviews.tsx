import api from '../../lib/axios';
import { devLog } from '../../utils/devLogger';

import React from "react";
import { Star, Send, User } from "lucide-react";

interface Review {
  _id: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  accentHue: number;
  isLoggedIn: boolean;
  username: string;
  userEmail: string;
  userImage: string;
  onSignInClick: () => void;
}

export default function ProductReviews({ productId, accentHue, isLoggedIn, username, userEmail, userImage, onSignInClick }: ProductReviewsProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [stats, setStats] = React.useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  const [formData, setFormData] = React.useState({
    customerName: username || "",
    customerEmail: userEmail || "",
    rating: 5,
    comment: "",
  });

  // Update form data when user logs in/out
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerName: username || "",
      customerEmail: userEmail || "",
    }));
  }, [isLoggedIn, username, userEmail]);

  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews?productId=${productId}`);
      if (res.data.success) {
        setReviews(res.data.data || []);
        setStats(res.data.stats || res.data.message || { totalReviews: 0, averageRating: 0 });
      }
    } catch (error) {
      devLog("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post("/reviews", {
        productId,
        ...formData,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: res.data.message });
        setFormData({ customerName: "", customerEmail: "", rating: 5, comment: "" });
        setShowForm(false);
        fetchReviews();
      } else {
        setMessage({ type: "error", text: res.data.error || "Failed to submit review" });
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || "Failed to submit review";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-600"
        }`}
      />
    ));
  };

  const accentColor = `hsl(${accentHue}, 70%, 60%)`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Rating Summary */}
      <div
        className="p-6 rounded-xl border border-white/10 backdrop-blur-sm mb-6"
        style={{
          background: `linear-gradient(135deg, hsla(${accentHue}, 50%, 55%, 0.08), hsla(${(accentHue + 60) % 360}, 50%, 55%, 0.08))`,
          borderColor: `hsla(${accentHue}, 50%, 55%, 0.15)`,
        }}
      >
        <h3 className="text-xl font-bold text-white mb-4">Customer Reviews</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold" style={{ color: accentColor }}>
              {stats.averageRating.toFixed(1)}
            </span>
            <div className="flex">{renderStars(Math.round(stats.averageRating), "w-6 h-6")}</div>
          </div>
          <div className="text-gray-400">
            <span className="font-semibold text-white">{stats.totalReviews}</span> reviews
          </div>
        </div>
      </div>

      {/* Review Form Toggle */}
      {!isLoggedIn ? (
        <button
          onClick={onSignInClick}
          className="w-full mb-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          style={{ borderColor: `hsla(${accentHue}, 50%, 55%, 0.2)` }}
        >
          <Send className="w-4 h-4" />
          Sign In to Write a Review
        </button>
      ) : (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          style={{ borderColor: `hsla(${accentHue}, 50%, 55%, 0.2)` }}
        >
          <Send className="w-4 h-4" />
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      )}

      {/* Review Form */}
      {showForm && (
        <div
          className="p-6 rounded-xl border border-white/10 backdrop-blur-sm mb-6"
          style={{
            background: `linear-gradient(135deg, hsla(${accentHue}, 50%, 55%, 0.05), hsla(${(accentHue + 60) % 360}, 50%, 55%, 0.05))`,
          }}
        >
          <h4 className="text-lg font-semibold text-white mb-4">Submit Your Review</h4>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                message.type === "success"
                  ? "bg-green-500/20 border border-green-500/30 text-green-400"
                  : "bg-red-500/20 border border-red-500/30 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  readOnly={isLoggedIn}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="John Doe"
                  style={isLoggedIn ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  readOnly={isLoggedIn}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="john@example.com"
                  style={isLoggedIn ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Review
              </label>
              <textarea
                required
                rows={4}
                maxLength={1000}
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
                placeholder="Share your experience with this product..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.comment.length}/1000 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, hsl(${accentHue}, 60%, 45%), hsl(${(accentHue + 60) % 360}, 70%, 45%))`,
              }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {userEmail && review.customerEmail === userEmail && userImage ? (
                    <img
                      src={userImage}
                      alt={review.customerName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-400/50"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: accentColor }}
                    >
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{review.customerName}</p>
                    <div className="flex gap-1">{renderStars(review.rating, "w-3 h-3")}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
