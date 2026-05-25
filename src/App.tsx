import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";

// Eager: tiny landing/index pages used at first paint
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";

// Lazy: route-level code splitting so each role only downloads its own bundle
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ParentTracker = lazy(() => import("./pages/ParentTracker"));
const ParentHome = lazy(() => import("./pages/parent/Home"));
const ParentChildren = lazy(() => import("./pages/parent/Children"));
const ParentProfile = lazy(() => import("./pages/parent/Profile"));
const ParentChat = lazy(() => import("./pages/parent/Chat"));
const ParentRingPrefs = lazy(() => import("./pages/parent/RingPreferences"));
const ParentDrivers = lazy(() => import("./pages/parent/Drivers"));
const DriverVerification = lazy(() => import("./pages/driver/Verification"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const RoleAuditLog = lazy(() => import("./pages/RoleAuditLog"));
const DriverHome = lazy(() => import("./pages/driver/Home"));
const DriverSetup = lazy(() => import("./pages/driver/Setup"));
const DriverProfile = lazy(() => import("./pages/driver/Profile"));
const DriverRoute = lazy(() => import("./pages/driver/RouteView"));
const SchoolShell = lazy(() => import("./components/school/SchoolShell"));
const SchoolSetup = lazy(() => import("./pages/school/Setup"));
const SchoolOverview = lazy(() => import("./pages/school/Overview"));
const SchoolVehicles = lazy(() => import("./pages/school/Vehicles"));
const SchoolRoutes = lazy(() => import("./pages/school/Routes"));
const SchoolStudents = lazy(() => import("./pages/school/Students"));
const SchoolDrivers = lazy(() => import("./pages/school/Drivers"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route path="/dashboard" element={<RequireAuth roles={["operator", "admin"]}><Dashboard /></RequireAuth>} />

              <Route path="/parent" element={<RequireAuth roles={["parent"]}><ParentHome /></RequireAuth>} />
              <Route path="/parent/track" element={<RequireAuth roles={["parent"]}><ParentTracker /></RequireAuth>} />
              <Route path="/parent/children" element={<RequireAuth roles={["parent"]}><ParentChildren /></RequireAuth>} />
              <Route path="/parent/profile" element={<RequireAuth roles={["parent"]}><ParentProfile /></RequireAuth>} />
              <Route path="/parent/chat" element={<RequireAuth roles={["parent"]}><ParentChat /></RequireAuth>} />
              <Route path="/parent/preferences" element={<RequireAuth roles={["parent"]}><ParentRingPrefs /></RequireAuth>} />
              <Route path="/parent/drivers" element={<RequireAuth roles={["parent"]}><ParentDrivers /></RequireAuth>} />

              <Route path="/driver/verify" element={<RequireAuth roles={["driver"]}><DriverVerification /></RequireAuth>} />
              <Route path="/driver/setup" element={<RequireAuth roles={["driver"]}><DriverSetup /></RequireAuth>} />
              <Route path="/driver" element={<RequireAuth roles={["driver"]}><DriverHome /></RequireAuth>} />
              <Route path="/driver/route" element={<RequireAuth roles={["driver"]}><DriverRoute /></RequireAuth>} />
              <Route path="/driver/profile" element={<RequireAuth roles={["driver"]}><DriverProfile /></RequireAuth>} />

              <Route path="/school/setup" element={<RequireAuth roles={["school"]}><SchoolSetup /></RequireAuth>} />
              <Route element={<RequireAuth roles={["school", "admin"]}><SchoolShell /></RequireAuth>}>
                <Route path="/school" element={<SchoolOverview />} />
                <Route path="/school/vehicles" element={<SchoolVehicles />} />
                <Route path="/school/routes" element={<SchoolRoutes />} />
                <Route path="/school/students" element={<SchoolStudents />} />
                <Route path="/school/drivers" element={<SchoolDrivers />} />
              </Route>

              <Route path="/admin/roles" element={<RequireAuth roles={["admin"]}><RoleManagement /></RequireAuth>} />
              <Route path="/admin/audit" element={<RequireAuth roles={["admin"]}><RoleAuditLog /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
