import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import {
  Activity,
  Bot,
  Clock3,
  Coins,
  FileCheck2,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import config from "~/config";
import { getAdminDashboardStatistics } from "~/services/statistic";
import styles from "./Admin.module.scss";

const cx = classNames.bind(styles);

function unwrap(response) {
  return response?.success ? response.data : response;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatCurrency(value) {
  return `${formatNumber(value)} VND`;
}

function formatUsd(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6,
  });
}

function formatChartDay(dateKey) {
  const [, month, day] = String(dateKey || "").split("-");
  return day && month ? `${day}/${month}` : dateKey;
}

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : date.toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : date.toLocaleString("vi-VN");
}

function formatPercent(value) {
  return value === null || value === undefined
    ? "-"
    : `${Number(value).toLocaleString("vi-VN")}%`;
}

function formatScore(value) {
  return value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("vi-VN");
}

function hasValues(rows, keys) {
  return (rows || []).some((row) => keys.some((key) => Number(row[key] || 0) > 0));
}

function getExamStatus(status) {
  const statuses = {
    published: { label: "Công khai", tone: "published" },
    completed: { label: "Hoàn thiện", tone: "completed" },
    draft: { label: "Bản nháp", tone: "draft" },
    hidden: { label: "Ẩn", tone: "hidden" },
  };
  return statuses[status] || { label: status || "Không rõ", tone: "unknown" };
}

function getPostStatus(status) {
  return Number(status) === 0
    ? { label: "Đã ẩn", tone: "hidden" }
    : { label: "Đang hiện", tone: "published" };
}

function Skeleton({ className }) {
  return <span className={cx("skeleton", className)} />;
}

function MetricCard({ icon: Icon, label, value, sub, tone, loading }) {
  return (
    <article className={cx("metric-card", tone)}>
      <span className={cx("metric-icon")}>
        <Icon size={20} />
      </span>
      <div>
        <p>{label}</p>
        {loading ? <Skeleton className="metric-skeleton" /> : <strong>{value}</strong>}
        <span>{sub}</span>
      </div>
    </article>
  );
}

function Panel({ title, subtitle, action, className, children }) {
  return (
    <section className={cx("panel", className)}>
      <div className={cx("panel-heading")}>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return <div className={cx("empty-state")}>{children}</div>;
}

function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setDashboardError("");
      const response = await getAdminDashboardStatistics();
      setDashboard(unwrap(response));
    } catch (error) {
      setDashboardError(error?.message || "Không thể tải dashboard admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary || {};
  const contentTotals = dashboard?.content?.totals || {};
  const userGrowth = dashboard?.trends?.userGrowth30d || [];
  const learningActivity = dashboard?.trends?.learningActivity30d || [];
  const examActivity = dashboard?.trends?.examActivity30d || [];
  const coverage = dashboard?.content?.jlptCoverage || [];
  const examRows = dashboard?.examOverview || [];
  const postRows = dashboard?.community?.recentPosts || [];
  const payments = dashboard?.payments || {};
  const paymentProviders = payments.providers30d || [];
  const ai = dashboard?.ai || {};
  const aiUsage = ai.usage30d;

  const cards = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: formatNumber(summary.totalUsers),
      sub: "Tài khoản trong hệ thống",
      tone: "tone-blue",
    },
    {
      icon: Activity,
      label: "User mới 30 ngày",
      value: formatNumber(summary.newUsers30d),
      sub: "Tăng trưởng gần đây",
      tone: "tone-green",
    },
    {
      icon: GraduationCap,
      label: "Người học hôm nay",
      value: formatNumber(summary.activeLearnersToday),
      sub: "Có bản ghi học tập",
      tone: "tone-teal",
    },
    {
      icon: Clock3,
      label: "Phút học 30 ngày",
      value: formatNumber(summary.studyMinutes30d),
      sub: "Tổng thời gian học",
      tone: "tone-rose",
    },
    {
      icon: FileCheck2,
      label: "Lượt làm đề 30 ngày",
      value: formatNumber(summary.examAttempts30d),
      sub: "Bài thi đã nộp",
      tone: "tone-amber",
    },
    {
      icon: Coins,
      label: "Premium đang hoạt động",
      value: formatNumber(summary.activePremiumUsers),
      sub: "User còn hạn Pro",
      tone: "tone-indigo",
    },
  ];

  if (!loading && dashboardError && !dashboard) {
    return (
      <div className={cx("page")}>
        <section className={cx("fatal-state")}>
          <strong>Không tải được dashboard admin.</strong>
          <p>{dashboardError}</p>
          <button type="button" onClick={() => loadDashboard()}>
            <RefreshCw size={16} />
            <span>Tải lại</span>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={cx("page")}>
      <header className={cx("header")}>
        <div>
          <span className={cx("eyebrow")}>Vận hành hệ thống</span>
          <h1>Bảng quản trị</h1>
          <p>Tổng quan người học, học liệu, đề thi, cộng đồng và dịch vụ Pro.</p>
        </div>
        <div className={cx("header-actions")}>
          <Link to={config.routes.user}>Người dùng</Link>
          <Link to={config.routes.dictionaryAdmin}>Từ điển</Link>
          <button
            type="button"
            onClick={() => {
              loadDashboard({ background: !!dashboard });
            }}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={cx({ spinning: refreshing })} />
            <span>{refreshing ? "Đang tải" : "Làm mới"}</span>
          </button>
        </div>
      </header>

      {dashboardError && dashboard && (
        <div className={cx("inline-error")}>{dashboardError}</div>
      )}

      <section className={cx("metrics-grid")}>
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading && !dashboard} />
        ))}
      </section>

      <section className={cx("chart-grid")}>
        <Panel title="User Growth" subtitle="Tài khoản mới trong 30 ngày gần nhất">
          {loading && !dashboard ? (
            <Skeleton className="chart-skeleton" />
          ) : !hasValues(userGrowth, ["users"]) ? (
            <EmptyState>Chưa có user mới trong khoảng thời gian này.</EmptyState>
          ) : (
            <div className={cx("chart")}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatChartDay} minTickGap={18} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={formatChartDay} formatter={(value) => [formatNumber(value), "User"]} />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Learning Activity" subtitle="Người học và tổng phút học theo ngày">
          {loading && !dashboard ? (
            <Skeleton className="chart-skeleton" />
          ) : !hasValues(learningActivity, ["activeLearners", "studyMinutes"]) ? (
            <EmptyState>Chưa có hoạt động học tập trong khoảng thời gian này.</EmptyState>
          ) : (
            <div className={cx("chart")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={learningActivity} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatChartDay} minTickGap={18} />
                  <YAxis yAxisId="learners" allowDecimals={false} />
                  <YAxis yAxisId="minutes" orientation="right" allowDecimals={false} />
                  <Tooltip labelFormatter={formatChartDay} formatter={(value, name) => [formatNumber(value), name]} />
                  <Bar yAxisId="learners" dataKey="activeLearners" name="Người học" fill="#0f766e" radius={[5, 5, 0, 0]} />
                  <Line yAxisId="minutes" type="monotone" dataKey="studyMinutes" name="Phút học" stroke="#e11d48" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Exam Activity" subtitle="Lượt nộp bài và số bài đạt">
          {loading && !dashboard ? (
            <Skeleton className="chart-skeleton" />
          ) : !hasValues(examActivity, ["attempts", "passed"]) ? (
            <EmptyState>Chưa có bài thi hoàn thành trong khoảng thời gian này.</EmptyState>
          ) : (
            <div className={cx("chart")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examActivity} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatChartDay} minTickGap={18} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={formatChartDay} formatter={(value) => formatNumber(value)} />
                  <Bar dataKey="attempts" name="Lượt nộp" fill="#7c3aed" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="passed" name="Đạt" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </section>

      <section className={cx("content-grid")}>
        <Panel
          title="JLPT Content Coverage"
          subtitle="Độ phủ từ vựng, kanji và ngữ pháp theo cấp độ"
          className="coverage-panel"
          action={<Link to={config.routes.dictionaryAdmin}>Quản lý học liệu</Link>}
        >
          {loading && !dashboard ? (
            <Skeleton className="chart-skeleton" />
          ) : !hasValues(coverage, ["words", "kanji", "grammar"]) ? (
            <EmptyState>Chưa có học liệu JLPT để thống kê.</EmptyState>
          ) : (
            <div className={cx("chart", "coverage-chart")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverage} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="level" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Bar stackId="content" dataKey="words" name="Từ vựng" fill="#16a34a" />
                  <Bar stackId="content" dataKey="kanji" name="Kanji" fill="#0284c7" />
                  <Bar stackId="content" dataKey="grammar" name="Ngữ pháp" fill="#db2777" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Content Status" subtitle="Kho học liệu và trạng thái xuất bản">
          <div className={cx("content-status")}>
            {[
              ["Từ vựng", contentTotals.words],
              ["Kanji", contentTotals.kanji],
              ["Ngữ pháp", contentTotals.grammar],
              ["Bài đọc published", contentTotals.readingPublished],
              ["Bài đọc chưa publish", contentTotals.readingUnpublished],
              ["Đề published", contentTotals.examsPublished],
              ["Đề draft", contentTotals.examsDraft],
              ["Đề hidden", contentTotals.examsHidden],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                {loading && !dashboard ? <Skeleton className="small-skeleton" /> : <strong>{formatNumber(value)}</strong>}
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className={cx("tables-grid")}>
        <Panel
          title="Exam Overview"
          subtitle="Đề thi cập nhật gần đây và kết quả 30 ngày"
          action={<Link to={config.routes.adminTest}>Quản lý đề thi</Link>}
        >
          {loading && !dashboard ? (
            <Skeleton className="table-skeleton" />
          ) : examRows.length === 0 ? (
            <EmptyState>Chưa có đề thi.</EmptyState>
          ) : (
            <div className={cx("table-wrap")}>
              <table>
                <thead>
                  <tr>
                    <th>Đề thi</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Lượt làm</th>
                    <th>Pass</th>
                    <th>Điểm TB</th>
                  </tr>
                </thead>
                <tbody>
                  {examRows.map((exam) => {
                    const status = getExamStatus(exam.status);
                    return (
                      <tr key={exam.id}>
                        <td>
                          <Link to={`/admin/tests/update/${exam.id}`}>
                            {exam.title || "Đề thi"}
                          </Link>
                          <small>Cập nhật {formatDate(exam.updatedAt)}</small>
                        </td>
                        <td>{exam.level || "-"}</td>
                        <td><span className={cx("status", status.tone)}>{status.label}</span></td>
                        <td>{formatNumber(exam.attempts30d)}</td>
                        <td>{formatPercent(exam.passRate30d)}</td>
                        <td>{formatScore(exam.averageScore30d)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title="Bài viết gần đây"
          subtitle={`${formatNumber(dashboard?.community?.totalPosts)} bài viết trong hệ thống`}
          action={<Link to={config.routes.adminPosts}>Quản lý bài viết</Link>}
        >
          {loading && !dashboard ? (
            <Skeleton className="table-skeleton" />
          ) : postRows.length === 0 ? (
            <EmptyState>Chưa có bài viết.</EmptyState>
          ) : (
            <div className={cx("table-wrap")}>
              <table>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Status</th>
                    <th>Bình luận</th>
                  </tr>
                </thead>
                <tbody>
                  {postRows.map((post) => {
                    const status = getPostStatus(post.status);
                    return (
                      <tr key={post.id}>
                        <td>
                          <Link to={config.routes.adminPosts}>{post.title || "Bài viết"}</Link>
                          <small>{formatDate(post.createdAt)}</small>
                        </td>
                        <td>{post.authorName || "-"}</td>
                        <td><span className={cx("status", status.tone)}>{status.label}</span></td>
                        <td>{formatNumber(post.comments)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

      <section className={cx("summary-grid")}>
        <Panel title="Payment Summary" subtitle="Dòng tiền Pro trong 30 ngày">
          <div className={cx("payment-summary")}>
            <article>
              <span>Doanh thu</span>
              <strong>{loading && !dashboard ? "-" : formatCurrency(payments.revenue30d)}</strong>
            </article>
            <article>
              <span>Thành công</span>
              <strong>{formatNumber(payments.successfulPayments30d)}</strong>
            </article>
            <article>
              <span>Thất bại</span>
              <strong>{formatNumber(payments.failedPayments30d)}</strong>
            </article>
            <article>
              <span>Đang chờ</span>
              <strong>{formatNumber(payments.pendingPayments30d)}</strong>
            </article>
          </div>
          <div className={cx("provider-list")}>
            {paymentProviders.length === 0 ? (
              <span>Chưa có payment thành công trong khoảng thời gian này.</span>
            ) : (
              paymentProviders.map((provider) => (
                <div key={provider.provider}>
                  <span>{provider.provider}</span>
                  <strong>{formatNumber(provider.count)} - {formatCurrency(provider.revenue)}</strong>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="AI Cost"
          subtitle="Token và chi phí generation trong 30 ngày từ Langfuse"
          action={
            ai.langfuseUrl ? (
              <a href={ai.langfuseUrl} target="_blank" rel="noreferrer">
                Mở Langfuse
              </a>
            ) : null
          }
        >
          {loading && !dashboard ? (
            <Skeleton className="ai-skeleton" />
          ) : !aiUsage ? (
            <div className={cx("ai-unavailable")}>
              <Bot size={20} />
              <div>
                <strong>Chi phí AI chưa sẵn sàng.</strong>
                <p>
                  {ai.retryAfter
                    ? `Backend sẽ thử Langfuse lại sau ${formatDateTime(ai.retryAfter)}.`
                    : "Langfuse chưa trả snapshot chi phí dùng được cho dashboard."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={cx("ai-summary")}>
                <article>
                  <span>Token AI 30 ngày</span>
                  <strong>{formatNumber(aiUsage.totalTokens)}</strong>
                </article>
                <article>
                  <span>Chi phí Langfuse</span>
                  <strong>{formatUsd(aiUsage.totalCostUsd)}</strong>
                </article>
                <article>
                  <span>Ước tính VND</span>
                  <strong>{formatCurrency(aiUsage.totalCostVnd)}</strong>
                </article>
              </div>
              <div className={cx("ai-meta")}>
                <span>Cập nhật {formatDateTime(ai.fetchedAt)}</span>
                <span>Tỷ giá {formatNumber(aiUsage.usdToVndRate)} VND/USD</span>
              </div>
            </>
          )}
        </Panel>
      </section>
    </div>
  );
}

export default Admin;
