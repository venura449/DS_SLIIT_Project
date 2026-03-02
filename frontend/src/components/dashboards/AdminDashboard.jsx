import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { logoutUser, authenticatedFetch } from "../../utils/authService";
import UpdateProfileForm from "../UpdateProfileForm";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ── UserManagement sub-component ── */
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    user_type: "",
  });
  const [confirmToggle, setConfirmToggle] = useState(null);
  const searchTimer = useRef(null);

  const totalPages = Math.ceil(total / limit);

  const fetchUsers = useCallback(
    async (pg, srch, role, status) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: pg,
          limit,
          search: srch,
          role,
          status,
        });
        const res = await authenticatedFetch(
          `${API_BASE}/auth/api/v1/admin/users?${params}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load users");
        setUsers(data.data.users);
        setTotal(data.data.pagination.total);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchUsers(page, search, roleFilter, statusFilter);
  }, [page, roleFilter, statusFilter, fetchUsers]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, val, roleFilter, statusFilter);
    }, 400);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name || "",
      phone: u.phone || "",
      user_type: u.user_type || "patient",
    });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      setEditError("Name is required");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/auth/api/v1/admin/users/${editUser.id}`,
        {
          method: "PUT",
          body: JSON.stringify(editForm),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id ? { ...u, ...data.data.user } : u,
        ),
      );
      setEditUser(null);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/auth/api/v1/admin/users/${userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !currentStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u,
        ),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmToggle(null);
    }
  };

  const roleColor = (role) => {
    if (role === "admin")
      return { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" };
    if (role === "doctor")
      return { bg: "#f0fdf4", color: "#15803d", border: "#86efac" };
    return { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" };
  };

  return (
    <>
      <style>{`
        .um-toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .um-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
        }
        .um-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #b0bec8;
          font-size: 14px;
          pointer-events: none;
        }
        .um-search {
          width: 100%;
          padding: 8px 12px 8px 32px;
          border: 1px solid #e4eaf0;
          border-radius: 7px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #3a5068;
          background: #fff;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .um-search:focus { outline: none; border-color: #7dd8f8; }
        .um-select {
          padding: 8px 30px 8px 12px;
          border: 1px solid #e4eaf0;
          border-radius: 7px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #3a5068;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23b0bec8'/%3E%3C/svg%3E") no-repeat right 10px center;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .um-select:focus { outline: none; border-color: #7dd8f8; }
        .um-count { font-size: 12px; color: #7a8fa6; white-space: nowrap; }

        /* Table row avatar */
        .um-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .um-user-cell {
          display: flex; align-items: center; gap: 9px;
        }
        .um-user-name { font-weight: 600; color: #1a3a52; font-size: 13px; }
        .um-user-email { font-size: 11px; color: #7a8fa6; }
        .um-status-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          margin-right: 5px;
          vertical-align: middle;
        }
        .um-actions { display: flex; gap: 6px; }
        .um-btn-edit {
          padding: 4px 11px;
          font-size: 11.5px;
          border-radius: 6px;
          border: 1px solid #e4eaf0;
          background: #f8fafc;
          color: #0a3d62;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .um-btn-edit:hover { border-color: #0a3d62; background: #eff6ff; }
        .um-btn-toggle-off {
          padding: 4px 11px;
          font-size: 11.5px;
          border-radius: 6px;
          border: 1px solid #fca5a5;
          background: #fff1f1;
          color: #dc2626;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .um-btn-toggle-off:hover { background: #fee2e2; }
        .um-btn-toggle-on {
          padding: 4px 11px;
          font-size: 11.5px;
          border-radius: 6px;
          border: 1px solid #86efac;
          background: #f0fdf4;
          color: #15803d;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .um-btn-toggle-on:hover { background: #dcfce7; }

        /* Pagination */
        .um-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .um-pagination-info { font-size: 12px; color: #7a8fa6; }
        .um-pagination-btns { display: flex; gap: 4px; }
        .um-pg-btn {
          min-width: 30px; height: 30px;
          padding: 0 8px;
          border-radius: 6px;
          border: 1px solid #e4eaf0;
          background: #fff;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          color: #3a5068;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .um-pg-btn:hover:not(:disabled) { border-color: #0a3d62; color: #0a3d62; background: #eff6ff; }
        .um-pg-btn.active { background: #0a3d62; color: #fff; border-color: #0a3d62; }
        .um-pg-btn:disabled { opacity: 0.35; cursor: default; }
        .um-pg-ellipsis { display: flex; align-items: center; padding: 0 4px; color: #b0bec8; font-size: 12px; }

        /* Modal overlay */
        .um-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .um-modal {
          background: #fff;
          border-radius: 12px;
          padding: 28px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.18);
        }
        .um-modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 6px;
        }
        .um-modal-sub { font-size: 12px; color: #7a8fa6; margin-bottom: 20px; }
        .um-field { margin-bottom: 14px; }
        .um-label { display: block; font-size: 12px; font-weight: 600; color: #3a5068; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.3px; }
        .um-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #e4eaf0;
          border-radius: 7px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a3a52;
          background: #fff;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .um-input:focus { outline: none; border-color: #7dd8f8; }
        .um-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: flex-end;
        }
        .um-btn-cancel {
          padding: 9px 18px;
          border-radius: 7px;
          border: 1px solid #e4eaf0;
          background: #f8fafc;
          color: #3a5068;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .um-btn-save {
          padding: 9px 18px;
          border-radius: 7px;
          border: none;
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(10,61,98,0.18);
          transition: opacity 0.15s;
        }
        .um-btn-save:hover { opacity: 0.88; }
        .um-btn-save:disabled { opacity: 0.5; cursor: default; }
        .um-err { color: #dc2626; font-size: 12px; margin-top: 10px; }

        /* Confirm dialog */
        .um-confirm-body { font-size: 13.5px; color: #3a5068; margin-bottom: 20px; line-height: 1.5; }
        .um-btn-danger {
          padding: 9px 18px;
          border-radius: 7px;
          border: none;
          background: #dc2626;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .um-btn-activate {
          padding: 9px 18px;
          border-radius: 7px;
          border: none;
          background: #15803d;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .um-skeleton-row td { background: linear-gradient(90deg, #f0f4f8 25%, #e8eef5 50%, #f0f4f8 75%); background-size: 400% 100%; animation: shimmer 1.2s infinite; color: transparent !important; border-radius: 4px; }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      `}</style>

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search-wrap">
          <span className="um-search-icon">🔍</span>
          <input
            className="um-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className="um-select"
          value={roleFilter}
          onChange={handleFilterChange(setRoleFilter)}
        >
          <option value="">All Roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="um-select"
          value={statusFilter}
          onChange={handleFilterChange(setStatusFilter)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="um-count">
          {total} user{total !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="um-err" style={{ marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="um-skeleton-row">
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: "#e8eef5",
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="6">No users found</td>
              </tr>
            ) : (
              users.map((u) => {
                const rc = roleColor(u.user_type);
                const initials = (u.name || "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar">{initials}</div>
                        <div>
                          <div className="um-user-name">{u.name}</div>
                          <div className="um-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="ad-badge"
                        style={{
                          background: rc.bg,
                          color: rc.color,
                          borderColor: rc.border,
                        }}
                      >
                        {u.user_type}
                      </span>
                    </td>
                    <td style={{ color: "#7a8fa6", fontSize: 12 }}>
                      {u.phone || "—"}
                    </td>
                    <td>
                      <span>
                        <span
                          className="um-status-dot"
                          style={{
                            background: u.is_active ? "#22c55e" : "#f87171",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: u.is_active ? "#15803d" : "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>
                    <td style={{ color: "#7a8fa6", fontSize: 12 }}>
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="um-actions">
                        <button
                          className="um-btn-edit"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                        {u.is_active ? (
                          <button
                            className="um-btn-toggle-off"
                            onClick={() => setConfirmToggle(u)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="um-btn-toggle-on"
                            onClick={() => setConfirmToggle(u)}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="um-pagination">
          <span className="um-pagination-info">
            Showing {Math.min((page - 1) * limit + 1, total)}–
            {Math.min(page * limit, total)} of {total}
          </span>
          <div className="um-pagination-btns">
            <button
              className="um-pg-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="um-pg-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`um-pg-btn${page === p ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              className="um-pg-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="um-modal-overlay" onClick={() => setEditUser(null)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-title">Edit User</div>
            <div className="um-modal-sub">{editUser.email}</div>
            <div className="um-field">
              <label className="um-label">Full Name</label>
              <input
                className="um-input"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="um-field">
              <label className="um-label">Phone</label>
              <input
                className="um-input"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="um-field">
              <label className="um-label">Role</label>
              <select
                className="um-input um-select"
                value={editForm.user_type}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, user_type: e.target.value }))
                }
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editError && <div className="um-err">{editError}</div>}
            <div className="um-modal-actions">
              <button
                className="um-btn-cancel"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
              <button
                className="um-btn-save"
                onClick={handleEditSave}
                disabled={editLoading}
              >
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Toggle Status */}
      {confirmToggle && (
        <div
          className="um-modal-overlay"
          onClick={() => setConfirmToggle(null)}
        >
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-title">
              {confirmToggle.is_active ? "Deactivate User" : "Activate User"}
            </div>
            <div className="um-confirm-body">
              {confirmToggle.is_active ? (
                <>
                  Are you sure you want to <strong>deactivate</strong>{" "}
                  <strong>{confirmToggle.name}</strong>? They will no longer be
                  able to log in.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>activate</strong>{" "}
                  <strong>{confirmToggle.name}</strong>? They will regain access
                  to the platform.
                </>
              )}
            </div>
            <div className="um-modal-actions">
              <button
                className="um-btn-cancel"
                onClick={() => setConfirmToggle(null)}
              >
                Cancel
              </button>
              {confirmToggle.is_active ? (
                <button
                  className="um-btn-danger"
                  onClick={() =>
                    handleToggleStatus(
                      confirmToggle.id,
                      confirmToggle.is_active,
                    )
                  }
                >
                  Deactivate
                </button>
              ) : (
                <button
                  className="um-btn-activate"
                  onClick={() =>
                    handleToggleStatus(
                      confirmToggle.id,
                      confirmToggle.is_active,
                    )
                  }
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── DoctorVerification sub-component ── */
function DoctorVerification() {
  const [submissions, setSubmissions] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const DOC_LABELS = {
    license: "Medical License",
    government_id: "Government ID",
    credentials: "Professional Credentials",
    insurance: "Insurance Certificate",
  };

  const STATUS_CFG = {
    no_documents: {
      bg: "#f8fafc",
      color: "#7a8fa6",
      border: "#e4eaf0",
      label: "No Docs",
    },
    pending: {
      bg: "#fffbeb",
      color: "#92400e",
      border: "#fcd34d",
      label: "⏳ Pending",
    },
    submitted_for_review: {
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "#93c5fd",
      label: "📋 Under Review",
    },
    approved: {
      bg: "#ecfdf5",
      color: "#065f46",
      border: "#6ee7b7",
      label: "✅ Approved",
    },
    rejected: {
      bg: "#fef2f2",
      color: "#dc2626",
      border: "#fecaca",
      label: "❌ Rejected",
    },
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subsRes, usersRes] = await Promise.all([
        authenticatedFetch(`${API_BASE}/doctors/api/v1/verification/all`),
        authenticatedFetch(
          `${API_BASE}/auth/api/v1/admin/users?role=doctor&limit=200`,
        ),
      ]);
      const subsData = await subsRes.json();
      if (!subsRes.ok)
        throw new Error(subsData.message || "Failed to load submissions");
      setSubmissions(Array.isArray(subsData.data) ? subsData.data : []);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData?.data?.users;
        if (Array.isArray(users)) {
          const map = {};
          users.forEach((u) => {
            map[u.id] = { name: u.name, email: u.email };
          });
          setUserMap(map);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (doctorId) => {
    setActionLoading(`${doctorId}_approve`);
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/doctors/api/v1/verification/approve/${doctorId}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.doctorId === doctorId ? { ...s, status: "approved" } : s,
        ),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    const { doctorId } = rejectModal;
    setActionLoading(`${doctorId}_reject`);
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/doctors/api/v1/verification/reject/${doctorId}`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: rejectReason.trim() || "No reason provided",
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.doctorId === doctorId
            ? { ...s, status: "rejected", rejectionReason: rejectReason.trim() }
            : s,
        ),
      );
      setRejectModal(null);
      setRejectReason("");
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const renderBadge = (status) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
      <span
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </span>
    );
  };

  const allFiltered = statusFilter
    ? (Array.isArray(submissions) ? submissions : []).filter(
        (s) => s.status === statusFilter,
      )
    : Array.isArray(submissions)
      ? submissions
      : [];

  const totalPages = Math.ceil(allFiltered.length / itemsPerPage);
  const safeCurrentPage =
    currentPage > totalPages && totalPages > 0 ? totalPages : currentPage;
  const filtered = allFiltered.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  return (
    <>
      <style>{`
        .dv-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .dv-flabel { font-size:12px; color:#7a8fa6; font-weight:600; }
        .dv-fbtn { padding:5px 14px; border-radius:20px; border:1px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .dv-fbtn:hover { border-color:#0a3d62; color:#0a3d62; }
        .dv-fbtn.dv-active { background:#0a3d62; color:#fff; border-color:#0a3d62; }
        .dv-refresh { margin-left:auto; padding:6px 14px; border-radius:7px; border:1px solid #e4eaf0; background:#f8fafc; color:#0a3d62; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; display:flex; align-items:center; gap:5px; }
        .dv-refresh:hover { background:#eff6ff; border-color:#0a3d62; }
        .dv-refresh:disabled { opacity:0.5; cursor:default; }
        .dv-count { font-size:12px; color:#7a8fa6; }
        .dv-exp-btn { background:none; border:none; cursor:pointer; font-size:11px; padding:3px 7px; border-radius:4px; color:#7a8fa6; transition:all 0.15s; }
        .dv-exp-btn:hover { background:#f0f4f8; color:#0a3d62; }
        .dv-docs-row > td { background:#f8fbff !important; padding:0 !important; border-bottom:2px solid #e4eaf0 !important; }
        .dv-docs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; padding:14px 16px; }
        .dv-doc-card { background:#fff; border:1px solid #e4eaf0; border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
        .dv-doc-type { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; color:#0a3d62; }
        .dv-doc-name { font-size:12px; color:#3a5068; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dv-doc-date { font-size:11px; color:#b0bec8; }
        .dv-doc-link { margin-top:6px; display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:5px; background:#eff6ff; color:#1d4ed8; font-size:11.5px; font-weight:600; text-decoration:none; border:1px solid #93c5fd; transition:all 0.15s; width:fit-content; }
        .dv-doc-link:hover { background:#dbeafe; }
        .dv-acts { display:flex; gap:6px; align-items:center; }
        .dv-pagination { display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding-top:12px; border-top:1px solid #e4eaf0; }
        .dv-pagination-info { font-size:12px; color:#7a8fa6; }
        .dv-pagination-btns { display:flex; gap:4px; }
        .dv-pg-btn { padding:4px 10px; border-radius:5px; border:1px solid #e4eaf0; background:#f8fafc; color:#0a3d62; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .dv-pg-btn:hover:not(:disabled) { border-color:#0a3d62; background:#eff6ff; }
        .dv-pg-btn:disabled { opacity:0.5; cursor:default; }
        .dv-pg-btn.active { background:#0a3d62; color:#fff; border-color:#0a3d62; }
        .dv-pg-ellipsis { padding:4px 6px; color:#7a8fa6; font-size:12px; }
        .dv-approve { padding:4px 11px; font-size:11.5px; border-radius:6px; border:1px solid #86efac; background:#f0fdf4; color:#15803d; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .dv-approve:hover { background:#dcfce7; }
        .dv-approve:disabled { opacity:0.5; cursor:default; }
        .dv-reject-btn { padding:4px 11px; font-size:11.5px; border-radius:6px; border:1px solid #fca5a5; background:#fff1f1; color:#dc2626; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .dv-reject-btn:hover { background:#fee2e2; }
        .dv-reject-btn:disabled { opacity:0.5; cursor:default; }
        .dv-rej-note { font-size:11px; color:#dc2626; font-style:italic; margin-top:2px; }
        .dv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
        .dv-modal { background:#fff; border-radius:12px; padding:28px; width:100%; max-width:420px; box-shadow:0 16px 48px rgba(0,0,0,0.18); }
        .dv-modal-title { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#dc2626; margin-bottom:6px; }
        .dv-modal-sub { font-size:13px; color:#7a8fa6; margin-bottom:16px; }
        .dv-textarea { width:100%; padding:9px 12px; border:1px solid #e4eaf0; border-radius:7px; font-size:13px; font-family:'DM Sans',sans-serif; color:#1a3a52; resize:vertical; min-height:80px; box-sizing:border-box; }
        .dv-textarea:focus { outline:none; border-color:#fca5a5; }
        .dv-modal-actions { display:flex; gap:10px; margin-top:16px; justify-content:flex-end; }
        .dv-modal-cancel { padding:9px 18px; border-radius:7px; border:1px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .dv-modal-confirm { padding:9px 18px; border-radius:7px; border:none; background:#dc2626; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .dv-modal-confirm:disabled { opacity:0.5; cursor:default; }
        @keyframes dv-shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      `}</style>

      {/* Toolbar */}
      <div className="dv-toolbar">
        <span className="dv-flabel">Filter:</span>
        {[
          { key: "", label: "All" },
          { key: "submitted_for_review", label: "Under Review" },
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`dv-fbtn${statusFilter === key ? " dv-active" : ""}`}
            onClick={() => {
              setStatusFilter(key);
              setCurrentPage(1);
            }}
          >
            {label}
          </button>
        ))}
        <span className="dv-count">
          {allFiltered.length} submission{allFiltered.length !== 1 ? "s" : ""}
        </span>
        <button
          className="dv-refresh"
          onClick={fetchSubmissions}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Doctor</th>
              <th>Docs</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}>
                      <div
                        style={{
                          height: 13,
                          borderRadius: 4,
                          background:
                            "linear-gradient(90deg,#f0f4f8 25%,#e8eef5 50%,#f0f4f8 75%)",
                          backgroundSize: "400% 100%",
                          animation: "dv-shimmer 1.2s infinite",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : allFiltered.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="6">
                  {statusFilter
                    ? `No ${statusFilter.replace(/_/g, " ")} submissions`
                    : "No verification submissions yet"}
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <Fragment key={sub.doctorId}>
                  <tr>
                    <td>
                      <button
                        className="dv-exp-btn"
                        onClick={() =>
                          setExpandedId((id) =>
                            id === sub.doctorId ? null : sub.doctorId,
                          )
                        }
                        title="View documents"
                      >
                        {expandedId === sub.doctorId ? "▼" : "▶"}
                      </button>
                    </td>
                    <td>
                      {userMap[sub.doctorId] ? (
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#1a3a52",
                            }}
                          >
                            {userMap[sub.doctorId].name}
                          </div>
                          <div style={{ fontSize: 11, color: "#7a8fa6" }}>
                            {userMap[sub.doctorId].email}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#3a5068",
                          }}
                          title={sub.doctorId}
                        >
                          {sub.doctorId.length > 20
                            ? `${sub.doctorId.slice(0, 20)}…`
                            : sub.doctorId}
                        </span>
                      )}
                      {sub.status === "rejected" && sub.rejectionReason && (
                        <div className="dv-rej-note">
                          Reason: {sub.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#0a3d62" }}>
                        {sub.documentsSubmitted}
                      </span>
                      <span style={{ color: "#b0bec8", fontSize: 11 }}>
                        {" "}
                        / {sub.totalRequired}
                      </span>
                    </td>
                    <td>{renderBadge(sub.status)}</td>
                    <td style={{ fontSize: 12, color: "#7a8fa6" }}>
                      {new Date(sub.lastUpdated).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="dv-acts">
                        {sub.status === "submitted_for_review" && (
                          <>
                            <button
                              className="dv-approve"
                              disabled={
                                actionLoading === `${sub.doctorId}_approve`
                              }
                              onClick={() => handleApprove(sub.doctorId)}
                            >
                              {actionLoading === `${sub.doctorId}_approve`
                                ? "…"
                                : "✓ Approve"}
                            </button>
                            <button
                              className="dv-reject-btn"
                              disabled={
                                actionLoading === `${sub.doctorId}_reject`
                              }
                              onClick={() => {
                                setRejectModal({ doctorId: sub.doctorId });
                                setRejectReason("");
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {sub.status === "approved" && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#065f46",
                              fontWeight: 600,
                            }}
                          >
                            ✅ Verified
                          </span>
                        )}
                        {sub.status === "rejected" && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#dc2626",
                              fontWeight: 600,
                            }}
                          >
                            ❌ Rejected
                          </span>
                        )}
                        {(sub.status === "pending" ||
                          sub.status === "no_documents") && (
                          <span style={{ fontSize: 12, color: "#92400e" }}>
                            Awaiting submission
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === sub.doctorId && (
                    <tr className="dv-docs-row">
                      <td colSpan="6">
                        {sub.documents && sub.documents.length > 0 ? (
                          <div className="dv-docs-grid">
                            {sub.documents.map((doc) => (
                              <div key={doc.id} className="dv-doc-card">
                                <div className="dv-doc-type">
                                  {DOC_LABELS[doc.documentType] ||
                                    doc.documentType}
                                </div>
                                <div
                                  className="dv-doc-name"
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </div>
                                <div className="dv-doc-date">
                                  {new Date(doc.uploadedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </div>
                                {doc.documentUrl ? (
                                  <a
                                    href={`${import.meta.env.VITE_API_BASE_URL}/doctors${doc.documentUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="dv-doc-link"
                                  >
                                    📄 View PDF
                                  </a>
                                ) : (
                                  <span
                                    style={{ fontSize: 11, color: "#b0bec8" }}
                                  >
                                    No URL available
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              color: "#b0bec8",
                            }}
                          >
                            No documents uploaded
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="dv-pagination">
          <span className="dv-pagination-info">
            Showing{" "}
            {Math.min(
              (safeCurrentPage - 1) * itemsPerPage + 1,
              allFiltered.length,
            )}
            –{Math.min(safeCurrentPage * itemsPerPage, allFiltered.length)} of{" "}
            {allFiltered.length}
          </span>
          <div className="dv-pagination-btns">
            <button
              className="dv-pg-btn"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safeCurrentPage) <= 1,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="dv-pg-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`dv-pg-btn${safeCurrentPage === p ? " active" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              className="dv-pg-btn"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="dv-overlay" onClick={() => setRejectModal(null)}>
          <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dv-modal-title">Reject Verification</div>
            <div className="dv-modal-sub">
              Provide a reason for rejection. The doctor will be notified.
            </div>
            <textarea
              className="dv-textarea"
              placeholder="e.g. Documents are unclear, expired, or incomplete…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="dv-modal-actions">
              <button
                className="dv-modal-cancel"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </button>
              <button
                className="dv-modal-confirm"
                onClick={handleRejectSubmit}
                disabled={actionLoading !== null}
              >
                {actionLoading ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "doctors", icon: "👨‍⚕️", label: "Doctor Verification" },
  { id: "reports", icon: "📈", label: "Reports" },
  { id: "settings", icon: "⚙️", label: "Settings" },
  { id: "logs", icon: "📋", label: "Activity Logs" },
];

const pageTitles = {
  overview: "Overview",
  users: "User Management",
  doctors: "Doctor Verification",
  reports: "Reports",
  settings: "System Settings",
  logs: "Activity Logs",
};

const AdminDashboard = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(initialUser);

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .ad-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fb;
        }

        /* â”€â”€ Sidebar â”€â”€ */
        .ad-sidebar {
          width: 220px;
          min-height: 100vh;
          background: #0a3d62;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          z-index: 100;
        }
        .ad-brand {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ad-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ad-brand-icon {
          width: 34px; height: 34px;
          background: rgba(125,216,248,0.18);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .ad-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .ad-brand-name span { color: #7dd8f8; }
        .ad-brand-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .ad-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ad-nav-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 11px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          transition: all 0.15s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .ad-nav-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ad-nav-btn.active { background: rgba(125,216,248,0.15); color: #7dd8f8; }
        .ad-nav-btn .ni { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .ad-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .ad-footer-user {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
        }
        .ad-avatar {
          width: 32px; height: 32px;
          background: rgba(125,216,248,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .ad-footer-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ad-footer-email {
          font-size: 10.5px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ad-footer-meta { flex: 1; min-width: 0; }
        .ad-signout {
          width: 100%;
          padding: 7px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .ad-signout:hover {
          background: rgba(255,70,70,0.15);
          border-color: rgba(255,70,70,0.25);
          color: #ff9999;
        }

        /* â”€â”€ Main â”€â”€ */
        .ad-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .ad-topbar {
          background: #fff;
          border-bottom: 1px solid #e4eaf0;
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0; z-index: 50;
        }
        .ad-topbar-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0a3d62;
        }
        .ad-topbar-right {
          font-size: 12.5px;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ad-profile-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(10, 61, 98, 0.1), rgba(125, 216, 248, 0.1));
          border: 1.5px solid #e4eaf0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 16px;
        }
        .ad-profile-btn:hover {
          background: linear-gradient(135deg, rgba(10, 61, 98, 0.15), rgba(125, 216, 248, 0.15));
          border-color: #7dd8f8;
          transform: scale(1.05);
        }
        .ad-content { padding: 22px 24px; }

        /* â”€â”€ Stat cards â”€â”€ */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .ad-stat {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 16px 18px;
        }
        .ad-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .ad-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7a8fa6;
        }
        .ad-stat-icon { font-size: 20px; opacity: 0.65; }
        .ad-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0a3d62;
          line-height: 1;
          margin-bottom: 3px;
        }
        .ad-stat-sub { font-size: 11px; color: #b0bec8; }

        /* â”€â”€ Sections â”€â”€ */
        .ad-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .ad-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0a3d62;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .ad-empty {
          text-align: center;
          padding: 28px 16px;
          color: #b0bec8;
        }
        .ad-empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.45; }
        .ad-empty p { font-size: 13px; }

        /* â”€â”€ Buttons â”€â”€ */
        .ad-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border-radius: 7px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .ad-btn-primary {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          box-shadow: 0 2px 6px rgba(10,61,98,0.18);
        }
        .ad-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .ad-btn-sm {
          padding: 5px 10px;
          font-size: 11.5px;
        }

        /* â”€â”€ Page header â”€â”€ */
        .ad-page-head { margin-bottom: 18px; }
        .ad-page-head h2 {
          font-family: 'Sora', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 2px;
        }
        .ad-page-head p { font-size: 13px; color: #7a8fa6; }

        /* â”€â”€ Table â”€â”€ */
        .ad-table-wrap { overflow-x: auto; }
        .ad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ad-table th {
          background: #f4f7fb;
          padding: 10px 14px;
          text-align: left;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #7a8fa6;
          border-bottom: 1px solid #e4eaf0;
        }
        .ad-table td {
          padding: 11px 14px;
          border-bottom: 1px solid #f0f4f8;
          color: #3a5068;
        }
        .ad-table tr:last-child td { border-bottom: none; }
        .ad-table tr:hover td { background: #fafcff; }
        .ad-table .empty-row td {
          text-align: center;
          padding: 32px;
          color: #b0bec8;
        }

        /* â”€â”€ Badges â”€â”€ */
        .ad-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .ad-badge-pending  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
        .ad-badge-verified { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
        .ad-badge-admin    { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
      `}</style>

      <div className="ad-root">
        {/* Sidebar */}
        <aside className="ad-sidebar">
          <div className="ad-brand">
            <div className="ad-brand-row">
              <div className="ad-brand-icon">🏥</div>
              <div>
                <div className="ad-brand-name">
                  Medi<span>Connect</span>
                </div>
                <div className="ad-brand-sub">Admin Panel</div>
              </div>
            </div>
          </div>

          <nav className="ad-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`ad-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ad-footer">
            <div className="ad-footer-user">
              <div className="ad-avatar">👨‍⚕️</div>
              <div className="ad-footer-meta">
                <div className="ad-footer-name">{user?.name || "Admin"}</div>
                <div className="ad-footer-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="ad-signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="ad-main">
          <header className="ad-topbar">
            <span className="ad-topbar-title">{pageTitles[activeTab]}</span>
            <div className="ad-topbar-right">
              <button
                className="ad-profile-btn"
                onClick={() => setShowProfile(true)}
                title="Edit profile"
              >
                👨‍⚕️
              </button>
              <span>{user?.name || "Admin"}</span>
            </div>
          </header>

          <div className="ad-content">
            {activeTab === "overview" && (
              <>
                <div className="ad-page-head">
                  <h2>System Overview</h2>
                  <p>Platform statistics and health at a glance.</p>
                </div>
                <div className="ad-stats">
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Total Users</div>
                      <div className="ad-stat-icon">👥</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Active accounts</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Doctors</div>
                      <div className="ad-stat-icon">👨‍⚕️</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Verified professionals</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Appointments</div>
                      <div className="ad-stat-icon">📅</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">This month</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Pending Review</div>
                      <div className="ad-stat-icon">⏳</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Verifications</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <div className="ad-page-head" style={{ marginBottom: 0 }}>
                    <h2>User Management</h2>
                    <p>View and manage all platform users.</p>
                  </div>
                </div>
                <div className="ad-section">
                  <UserManagement />
                </div>
              </>
            )}

            {activeTab === "doctors" && (
              <>
                <div className="ad-page-head">
                  <h2>Doctor Verification</h2>
                  <p>Review and approve doctor credential submissions.</p>
                </div>
                <div className="ad-section">
                  <DoctorVerification />
                </div>
              </>
            )}

            {activeTab === "reports" && (
              <>
                <div className="ad-page-head">
                  <h2>Reports</h2>
                  <p>Platform analytics and usage statistics.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-section-title">
                    ðŸ“Š Monthly Statistics
                  </div>
                  <div className="ad-empty">
                    <div className="ad-empty-icon">ðŸ“ˆ</div>
                    <p>Reports and analytics will be displayed here.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <div className="ad-page-head">
                  <h2>System Settings</h2>
                  <p>Configure platform behavior and integrations.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-section-title">
                    ðŸ”§ Platform Configuration
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a8fa6",
                      marginBottom: "16px",
                    }}
                  >
                    Manage API endpoints, authentication keys, and system
                    integrations.
                  </p>
                  <button className="ad-btn ad-btn-primary">
                    Configure Settings
                  </button>
                </div>
              </>
            )}

            {activeTab === "logs" && (
              <>
                <div className="ad-page-head">
                  <h2>Activity Logs</h2>
                  <p>Track all user actions and system events.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="empty-row">
                          <td colSpan="5">No activity logs available</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showProfile && (
        <UpdateProfileForm
          user={user}
          onClose={() => setShowProfile(false)}
          onSuccess={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default AdminDashboard;
