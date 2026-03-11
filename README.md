# 🆘 Jan Setu Support

**Jan Setu Support** is a mission-critical emergency response platform designed to bridge the gap between victims and emergency services. By leveraging real-time communication and location tracking, it ensures that help reaches those in need as quickly as possible.

---

## 🏗️ Project Architecture

The platform is built on a dual-service architecture to handle emergencies efficiently:

1.  **User Portal (Emergency Response)**: A streamlined interface for victims to report emergencies, fill medical details, and connect instantly with support.
2.  **Support Dashboard (Control Center)**: A comprehensive management system for support staff to verify emergencies, dispatch volunteers, and track the rescue progress in real-time.

---

## 🔄 How It Works

Our workflow ensures a seamless transition from reporting to rescue:

### 1. Emergency Reporting
The process begins when a user fills out the **EMR (Electronic Medical Record) Form**. This form captures critical information about the victim's condition and automatically shares their precise location.

### 2. Instant Video Call (WebRTC)
Immediately after the form is submitted, a **WebRTC-powered video call** is established between the user and the support team. This allows support staff to visually assess the situation and provide life-saving instructions in real-time.

### 3. Verification & Dispatch
The support team confirms the emergency's severity through the video call. Once verified, they **dispatch volunteers** based on proximity to the incident.

### 4. Volunteer Coordination
The dispatched volunteer's details are sent to the **Volunteer Dashboard**. At this stage, an API endpoint provides real-time access to the volunteer's status and information.

### 5. Precision Tracking
The system establishes a tracking link between the volunteer and the victim's original location. Support staff can **track the volunteer's live location** as they navigate toward the victim, ensuring full visibility of the rescue operation.

---

## 🛠️ Tech Stack

-   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
-   **WebRTC**: [ZegoCloud](https://www.zegocloud.com/) / [PeerJS](https://peerjs.com/) for reliable video communication.
-   **Mapping & Tracking**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/).
-   **State Management**: [React Query (TanStack)](https://tanstack.com/query/latest).
-   **Icons**: [Lucide React](https://lucide.dev/).

---

## 🚀 Getting Started

To run the project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Sangeeta-Rani14/support.git
    cd jan-setu-support
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Access the application**:
    -   **Live Link**: [support-one-psi.vercel.app](https://support-one-psi.vercel.app)
    -   **User Portal (EMR Form)**: `https://support-one-psi.vercel.app/emr-form`
    -   **Support Dashboard**: `https://support-one-psi.vercel.app/support/dashboard`

---

## 🌐 API Reference

The project includes internal APIs for managing volunteer data and tracking:
-   `GET /api/volunteers`: Fetch live volunteer details.
-   `POST /api/dispatch`: Dispatch a volunteer to a specific emergency location.

---

*Jan Setu Support — Saving lives through technology.*
