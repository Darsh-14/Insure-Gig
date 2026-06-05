import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

const earningsData = [
  { day: "Mon", actual: 1200, protected: 1500 },
  { day: "Tue", actual: 1400, protected: 1500 },
  { day: "Wed", actual: 800, protected: 1500 },
  { day: "Thu", actual: 1300, protected: 1500 },
  { day: "Fri", actual: 1100, protected: 1500 },
  { day: "Sat", actual: 1600, protected: 1500 },
  { day: "Sun", actual: 1450, protected: 1500 },
];

export function DashboardHome() {
  return (
    <div className="p-6 space-y-6 relative">
      {/* Floating Background */}
      <motion.div
        className="absolute top-10 right-10 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          y: [0, 40, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your weekly overview.</p>
      </motion.div>

      {/* Top Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -10, rotateY: 5, scale: 1.03 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card className="relative overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Weekly Earnings Protected
              </CardTitle>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Shield className="w-5 h-5 text-brand-500" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold text-gray-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              >
                ₹1,500
              </motion.div>
              <p className="text-sm text-gray-500 mt-1">Premium Plan Active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -10, rotateY: 5, scale: 1.03 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card className="relative overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-2xl"
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Coverage
              </CardTitle>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold text-green-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              >
                ₹3,000
              </motion.div>
              <p className="text-sm text-gray-500 mt-1">Max payout available</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -10, rotateY: 5, scale: 1.03 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card className="relative overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Risk Level
              </CardTitle>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold text-orange-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              >
                Medium
              </motion.div>
              <p className="text-sm text-gray-500 mt-1">Rain predicted tomorrow</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Earnings vs Protected Income
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#009AFD"
                  strokeWidth={2}
                  name="Actual Earnings"
                />
                <Line
                  type="monotone"
                  dataKey="protected"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Protected Income"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts Section */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="border-orange-200 bg-orange-50 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-200/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <CardHeader>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </motion.div>
              <CardTitle className="text-orange-900">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <motion.div
              className="flex items-start gap-3 p-3 bg-white rounded-lg"
              whileHover={{ x: 10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Heavy Rain Alert</p>
                <p className="text-sm text-gray-600">Expected 40mm rainfall tomorrow. Coverage is active.</p>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">Active</Badge>
            </motion.div>
            <motion.div
              className="flex items-start gap-3 p-3 bg-white rounded-lg"
              whileHover={{ x: 10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">AQI Warning</p>
                <p className="text-sm text-gray-600">Poor air quality (AQI 280) detected in your area.</p>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">Monitoring</Badge>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  title: "Claim Approved",
                  desc: "₹360 credited to your wallet",
                  time: "2 hours ago",
                  amount: "+₹360",
                  color: "green",
                  delay: 0.1
                },
                {
                  icon: Clock,
                  title: "Claim Triggered",
                  desc: "Heavy rain disruption detected",
                  time: "3 hours ago",
                  color: "blue",
                  delay: 0.2
                },
                {
                  icon: Shield,
                  title: "Premium Plan Activated",
                  desc: "Coverage: ₹3,000/week",
                  time: "2 days ago",
                  color: "purple",
                  delay: 0.3
                }
              ].map((activity) => (
                <motion.div
                  key={activity.title}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + activity.delay }}
                  whileHover={{ x: 10, scale: 1.02 }}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full bg-${activity.color}-100 flex items-center justify-center`}
                    style={{
                      background: activity.color === "green" ? "rgb(220, 252, 231)" :
                                 activity.color === "blue" ? "rgb(205, 235, 255)" :
                                 "rgb(243, 232, 255)"
                    }}
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <activity.icon
                      className={`w-5 h-5`}
                      style={{
                        color: activity.color === "green" ? "#16a34a" :
                               activity.color === "blue" ? "#009AFD" :
                               "#9333ea"
                      }}
                    />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.desc}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <motion.span
                      className="text-green-600 font-semibold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 1 + activity.delay }}
                    >
                      {activity.amount}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
