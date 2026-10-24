---
name: ros-ai-robotics-developer
description: >
  Use this Skill when developing advanced, production-grade intelligent robotic systems
  using ROS (Robot Operating System) with full-stack integration of AI perception pipelines,
  deep learning inference, autonomous navigation, IoT and cloud connectivity, real-time
  object detection and tracking, SLAM-based localization, and fleet management. Trigger
  when the user requests: ROS node/package design, SLAM or Nav2 navigation, camera or
  LiDAR perception, YOLO or deep learning integration, robot IoT connectivity, multi-robot
  coordination, Gazebo or Isaac Sim simulation, edge AI deployment (Jetson, Coral), or
  any production robotics architecture spanning perception → planning → control → cloud.
---

# ROS AI Robotics Developer

## Instructions

Provide structured, production-level guidance for building complete intelligent robotic
systems using ROS 1 (Noetic) and ROS 2 (Humble, Jazzy, Iron). The agent must:

- Design modular, scalable ROS-based system architectures.
- Integrate AI, deep learning, and multi-modal perception systems.
- Implement autonomous navigation, SLAM, and real-time path planning.
- Build object detection, tracking, and visual perception pipelines.
- Enable IoT communication, cloud integration, and fleet management.
- Deploy AI models on edge hardware and optimize for real-time performance.
- Structure ROS workspaces in clean, maintainable, production-ready formats.
- Support simulation, testing, DevOps, and secure deployment pipelines.

---

## Core Architecture Overview

All robot software stacks follow a unified pipeline from sensors to actuators and cloud:

```
[Sensors: Camera / LiDAR / IMU / GPS]
         │
         ▼  (ROS 2 Topics: sensor_msgs)
[Perception Node: YOLO + DeepSORT / Depth Fusion]
         │                          │
         ▼                          ▼ (MQTT / WebSocket)
[Nav2 Global Planner]        [IoT Bridge → Cloud Dashboard]
   (Smac / A* / RRT*)
         │
         ▼
[Nav2 Local Planner: TEB / MPPI / DWA]
         │
         ▼  (cmd_vel)
[Motor Drivers / Hardware Interface]
```

---

## 1. ROS System Development

### Supported Versions
- **ROS 1:** Noetic (Ubuntu 20.04)
- **ROS 2:** Humble (Ubuntu 22.04), Jazzy / Iron (Ubuntu 24.04)

### Core ROS Primitives
Implement and structure the following for every system:

| Primitive   | Purpose |
|-------------|---------|
| Nodes       | Isolated computational units |
| Topics      | Async pub/sub data streams |
| Services    | Synchronous request/response calls |
| Actions     | Long-running goal-based tasks |
| Parameters  | Runtime configuration |
| Launch files | Multi-node orchestration |

### Workspace Structure

```
/ros_ws
  /src
    /perception          # Vision, YOLO, depth, tracking
    /navigation          # SLAM, Nav2, planners, costmaps
    /planning            # Route optimization, task planners
    /control             # Motor drivers, PID, MPC
    /tracking            # Object/person tracking, localization
    /iot                 # MQTT bridge, cloud connector
    /ai_models           # Model configs, ONNX, TensorRT assets
    /interfaces          # Custom .msg, .srv, .action definitions
  /launch                # System-level launch files
  /config                # YAML parameter files
  /maps                  # Pre-built occupancy / 3D maps
  /urdf                  # Robot model descriptions
  /scripts               # Utility and data tools

/simulation              # Gazebo worlds, Isaac Sim assets
/logs                    # rosbag2 recordings, inference logs
/docs                    # Architecture docs, API references
```

### Design Rules
- Keep nodes lightweight and single-purpose.
- Use custom message types only when standard `std_msgs`, `sensor_msgs`, `vision_msgs` are insufficient.
- Document all published and subscribed topics in each node's header.
- Separate perception, planning, and control logic — never mix concerns across packages.
- Use reusable libraries; avoid duplicating utility code across packages.

---

## 2. AI Perception Pipeline

### Image Transport & ROS Vision Bridge

Use efficient image transport to avoid system lag:
- `sensor_msgs/msg/Image` for raw frames.
- `sensor_msgs/msg/CompressedImage` for bandwidth-constrained channels.
- `cv_bridge` to convert between ROS image messages and OpenCV `cv::Mat` arrays.

```python
# ROS 2 Python — cv_bridge example
from cv_bridge import CvBridge
bridge = CvBridge()

def image_callback(msg):
    cv_image = bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
    # Run OpenCV or deep learning inference on cv_image
```

### Deep Learning & Object Detection

Integrate state-of-the-art detectors inside ROS nodes:

| Model          | Use Case                                  | Backend         |
|----------------|-------------------------------------------|-----------------|
| YOLO v8 / v11  | Real-time object detection                | PyTorch / TensorRT |
| SSD MobileNet  | Lightweight edge detection                | TFLite / TensorRT |
| Faster R-CNN   | High-accuracy detection                   | PyTorch         |
| Vision Transformer (ViT) | Scene understanding           | ONNX Runtime    |
| CLIP           | Open-vocabulary classification            | PyTorch         |

Publish detection results using `vision_msgs/msg/Detection2DArray` or `Detection3DArray`.

### Edge AI Deployment

Optimize models for deployment on constrained hardware:
- **NVIDIA Jetson (Nano / Xavier / Orin):** Use TensorRT for FP16/INT8 inference.
- **Google Coral:** Use Edge TPU with TFLite delegate.
- **Raspberry Pi:** Use ONNX Runtime with NEON acceleration.

### Object Tracking

Maintain stable target identities across frames using:
- **ByteTrack** — high-accuracy multi-object tracking with re-identification.
- **DeepSORT** — appearance + motion-based tracking using re-ID embeddings.
- Trackers preserve unique IDs even when targets are temporarily occluded.

```python
# Pseudocode integration with YOLO + ByteTrack in ROS 2 node
detections = yolo_model.predict(cv_image)
tracks = byte_tracker.update(detections)
for track in tracks:
    publish_tracked_target(track.id, track.bbox, track.class_label)
```

### Camera & Sensor Configuration

Support the following perception modalities:
- **Monocular cameras:** Object detection, lane detection, face recognition.
- **RGB-D cameras (e.g., Intel RealSense, ZED):** Depth-augmented detection, 3D localization.
- **LiDAR (Velodyne, Ouster, RPLIDAR):** SLAM, obstacle detection, 3D object detection.
- **Multi-camera fusion:** Covering wide fields of view for warehouse or outdoor robots.

Always perform **camera calibration** using `camera_calibration` package before deployment.

---

## 3. Navigation & Path Planning

### SLAM (Simultaneous Localization and Mapping)

Select SLAM method based on sensor configuration:

| SLAM Package   | Sensors Required         | Best For                      |
|----------------|--------------------------|-------------------------------|
| RTAB-Map       | RGB-D or LiDAR + Camera  | Indoor 3D mapping             |
| Cartographer   | LiDAR (2D/3D)            | Large-scale floor mapping     |
| SLAM Toolbox   | LiDAR (2D)               | Lightweight ROS 2 SLAM        |
| ORB-SLAM3      | Stereo / Mono camera     | Visual SLAM, loop closure     |

The standard coordinate frame chain is:
```
map → odom → base_link → sensor_frames
```

Use `robot_localization` (EKF node) to fuse:
- Wheel odometry
- IMU (9-DOF)
- GPS (outdoor)
- LiDAR scan matching odometry

### Nav2 Navigation Stack (ROS 2)

The industry standard for autonomous navigation in ROS 2. Configure all of the following:

**Global Planners (Route Planning):**

| Planner        | Algorithm       | Best For                        |
|----------------|-----------------|----------------------------------|
| NavFn Planner  | Dijkstra / A*   | Simple grid-based navigation     |
| Smac Planner   | Hybrid A*       | Non-holonomic, kinematic paths   |
| Theta* Planner | Any-angle A*    | Smooth paths in open environments|

**Local Planners (Maneuvering & Obstacle Avoidance):**

| Controller         | Behavior                                         |
|--------------------|--------------------------------------------------|
| DWA (ROS 1)        | Dynamic Window Approach, fast, simple            |
| TEB Controller     | Timed Elastic Band — reversing, sharp turns      |
| MPPI Controller    | Model Predictive Path Integral — smooth, adaptive|

TEB and MPPI are preferred for robots operating around humans — they enable smooth deceleration, sharp cornering, and reactive obstacle avoidance.

**Costmap Configuration:**
- **Global Costmap:** Static map + inflation layer.
- **Local Costmap:** Rolling window with obstacle and inflation layers.
- Tune `inflation_radius` and `cost_scaling_factor` based on robot size.

### Path Planning Algorithms (Custom / Research)

Implement from scratch or via libraries:

| Algorithm    | Type            | Strengths                            |
|--------------|-----------------|--------------------------------------|
| A*           | Graph search    | Optimal, grid-based                  |
| Dijkstra     | Graph search    | Guaranteed shortest path             |
| RRT          | Sampling        | High-dimensional spaces              |
| RRT*         | Sampling        | Asymptotically optimal               |
| Bezier / Spline | Smoothing    | Post-processing for smooth trajectories |

Apply Bezier or spline smoothing to planner outputs before executing.

---

## 4. Localization & Mobile Tracking

### Sensor Fusion for Localization

Use the **Extended Kalman Filter (EKF)** or **Unscented Kalman Filter (UKF)** via `robot_localization`:

```yaml
# robot_localization EKF config (ekf.yaml)
frequency: 30
sensor_timeout: 0.1
odom0: /wheel/odometry
odom0_config: [true, true, false, false, false, true, true, true, false, false, false, true, false, false, false]
imu0: /imu/data
imu0_config: [false, false, false, true, true, true, false, false, false, false, false, false, true, false, false]
```

### Localization Methods by Environment

| Environment   | Method                                   |
|---------------|------------------------------------------|
| Indoor        | AMCL + LiDAR map matching                |
| Indoor 3D     | RTAB-Map with RGB-D                      |
| Outdoor       | GPS + IMU + EKF fusion                   |
| GPS-Denied    | Visual odometry + IMU (ORB-SLAM3)        |
| Multi-Robot   | Shared map with distributed AMCL         |

---

## 5. Control Systems

### Motor Control

Implement low-level controllers for hardware interfaces:
- **PID Controller:** Position and velocity control with tunable `Kp`, `Ki`, `Kd`.
- **MPC (Model Predictive Control):** Optimal control with constraint handling.
- Use `ros2_control` framework with hardware interface plugins for clean driver abstraction.

```yaml
# ros2_control configuration
controller_manager:
  ros__parameters:
    update_rate: 100
    diff_drive_controller:
      type: diff_drive_controller/DiffDriveController
```

### Trajectory Execution
- Subscribe to `cmd_vel` from Nav2 local planner.
- Apply rate limiting, acceleration smoothing, and safety stops.
- Publish `odom` based on wheel encoder feedback.

---

## 6. IoT & Cloud Connectivity

### Communication Protocols

| Protocol      | Use Case                                         |
|---------------|--------------------------------------------------|
| MQTT          | Lightweight telemetry, sensor data streaming     |
| WebSockets    | Real-time bidirectional dashboard updates        |
| REST API      | Command dispatch, configuration management       |
| DDS / Zenoh   | Multi-robot LAN/WAN peer-to-peer coordination    |

### MQTT Bridge Integration

Use `rosbridge_suite` or a custom MQTT bridge node:

```python
# Example: Publish ROS 2 topic to MQTT
import paho.mqtt.client as mqtt
import rclpy
from std_msgs.msg import String

mqtt_client = mqtt.Client()
mqtt_client.connect("broker.host", 1883)

def ros_callback(msg):
    mqtt_client.publish("robot/status", msg.data)
```

### Cloud Platforms

| Platform        | Key Services Used                              |
|-----------------|------------------------------------------------|
| AWS IoT Core    | MQTT broker, device shadow, fleet indexing     |
| Azure IoT Hub   | Device registry, telemetry routing, OTA updates|
| Google Cloud IoT| Pub/Sub messaging, Cloud Functions             |
| ThingsBoard     | Open-source IoT dashboard with MQTT support    |

### Fleet Management

- **Foxglove Studio:** Remote visualization and monitoring over WebSocket.
- **Formant:** Cloud-based fleet operations, video streaming, remote control.
- **Custom Dashboard:** Build with React + MQTT.js for real-time status panels.

Enable:
- Remote teleoperation via WebSocket + `teleop_twist_web`.
- OTA firmware and configuration updates.
- Per-robot telemetry: battery, task status, position, errors.
- Multi-robot task allocation with centralized job queue.

---

## 7. Data Management

### Sensor Recording

```bash
# ROS 2: Record all topics
ros2 bag record -a -o mission_2025_01_01

# Record specific topics
ros2 bag record /camera/image_raw /lidar/scan /odom -o filtered_bag
```

### Storage Backends

| Database     | Use Case                                |
|--------------|-----------------------------------------|
| PostgreSQL   | Structured mission logs, event records  |
| MongoDB      | Flexible sensor metadata, detections    |
| InfluxDB     | Time-series telemetry (battery, velocity)|
| MinIO / S3   | Large bag files, model artifacts        |

### AI Dataset Generation

Use `rosbag2` recordings as ground truth for:
- Object detection dataset labeling.
- Navigation trajectory replay.
- Simulation environment reconstruction.

---

## 8. Simulation & Testing

### Simulators

| Tool              | Strengths                                        |
|-------------------|--------------------------------------------------|
| Gazebo Classic    | Mature, ROS 1 compatible, large plugin ecosystem |
| Ignition Gazebo   | ROS 2 native, modern physics, cloud-ready        |
| NVIDIA Isaac Sim  | Photorealistic, GPU-accelerated, AI training     |
| Webots            | Lightweight, cross-platform, beginner-friendly   |
| RViz2             | Sensor data and planning visualization           |

### Testing Workflow

1. **Unit Tests:** Test individual ROS nodes with `pytest` + `rclpy` mock publishers.
2. **Integration Tests:** Run full navigation stack in Gazebo; validate path completion.
3. **AI Validation:** Test YOLO inference accuracy against labeled datasets.
4. **Hardware-in-Loop:** Replay `rosbag2` recordings to test node behavior offline.

---

## 9. DevOps & Deployment

### Containerization

```dockerfile
# Dockerfile for ROS 2 Humble deployment
FROM ros:humble
RUN apt-get update && apt-get install -y python3-colcon-common-extensions
COPY ros_ws/ /ros_ws/
WORKDIR /ros_ws
RUN . /opt/ros/humble/setup.sh && colcon build
CMD ["ros2", "launch", "robot_bringup", "full_system.launch.py"]
```

### CI/CD Pipeline

- **GitHub Actions / GitLab CI:** Trigger build, test, and simulation validation on each push.
- **Automated testing:** Run navigation scenarios in headless Gazebo.
- **Docker registry:** Push validated images to DockerHub or private registry.

### Target Deployment Hardware

| Device                    | Profile                                   |
|---------------------------|-------------------------------------------|
| NVIDIA Jetson Orin        | High-performance edge AI + ROS 2          |
| NVIDIA Jetson Nano/Xavier | Mid-range edge, TensorRT inference        |
| Raspberry Pi 4/5          | Lightweight nodes, sensor interfacing     |
| x86 Robot Servers         | Full-stack navigation + heavy AI workloads|
| Cloud VMs                 | Fleet management, simulation              |

---

## 10. Security & Reliability

### Communication Security
- Enable **DDS Security** (SROS2) for encrypted ROS 2 topic communication.
- Use **TLS certificates** for MQTT and WebSocket cloud connections.
- Implement **role-based access control** for remote operations.

### Fault Tolerance
- Deploy **watchdog nodes** that monitor critical node heartbeats.
- Implement **safe stop behavior** triggered by node failures or sensor loss.
- Use **lifecycle nodes** (ROS 2) for managed startup and graceful shutdown.
- Apply **fallback behaviors**: if SLAM fails, switch to GPS; if GPU fails, use CPU inference.

### Performance Optimization
- Profile node CPU and memory usage with `ros2 topic hz` and `htop`.
- Pin time-critical nodes to dedicated CPU cores using `chrt` or Docker CPU affinity.
- Use **zero-copy transport** (Cyclone DDS with loaned messages) for large image topics.
- Quantize AI models to INT8 with TensorRT for 3–5× inference speedup.

---

## Recommended Technology Stack

| Category          | Tools & Libraries                                                    |
|-------------------|----------------------------------------------------------------------|
| OS & Middleware   | Ubuntu 22.04 LTS + **ROS 2 Humble** (LTS) or Jazzy                  |
| Simulation        | **Ignition Gazebo** (primary), NVIDIA Isaac Sim (AI training)        |
| AI / Vision       | PyTorch, TensorRT, **YOLO v8/v11**, OpenCV, `cv_bridge`, ONNX Runtime|
| Tracking          | **ByteTrack**, DeepSORT                                              |
| Navigation        | **Nav2**, SLAM Toolbox, RTAB-Map, `robot_localization` (EKF)         |
| IoT / Comm        | **MQTT** (Mosquitto), `rosbridge_suite`, Zenoh, Foxglove Studio      |
| Cloud             | AWS IoT Core, ThingsBoard, Azure IoT Hub                             |
| Languages         | **C++** (performance-critical nodes) + **Python** (AI/IoT prototyping)|
| DevOps            | Docker, GitHub Actions, colcon, rosdep                               |

---

## Examples

### Example 1 — Autonomous Indoor Delivery Robot

**User Request:**
> Build a robot that autonomously navigates a warehouse and delivers packages to marked stations.

**Agent Should:**
1. Set up SLAM Toolbox for real-time 2D map building with LiDAR.
2. Configure Nav2 with Smac Planner (global) and MPPI Controller (local).
3. Integrate RGB-D camera with YOLO v8 to detect station markers.
4. Use `robot_localization` EKF to fuse LiDAR odometry + IMU.
5. Implement an action server to accept delivery goals and report completion.
6. Add an MQTT bridge to publish delivery status to a cloud dashboard.
7. Handle dynamic obstacles (people, forklifts) with reactive local re-planning.

---

### Example 2 — Real-Time Object Detection & Tracking Robot

**User Request:**
> Build a robot that detects and continuously tracks multiple objects in real-time.

**Agent Should:**
1. Integrate YOLO v8 inside a dedicated ROS 2 perception node.
2. Apply ByteTrack to maintain unique IDs across frames.
3. Use `cv_bridge` to pass camera frames between ROS and OpenCV.
4. Publish `vision_msgs/Detection2DArray` with track IDs and bounding boxes.
5. Visualize tracks live in RViz2 using `visualization_msgs/MarkerArray`.
6. Optimize with TensorRT on Jetson Orin for sub-20ms inference latency.

---

### Example 3 — IoT-Connected Robot Fleet

**User Request:**
> Build a system for remotely managing and monitoring a fleet of five robots.

**Agent Should:**
1. Deploy MQTT broker (Mosquitto) and connect all robots as clients.
2. Publish per-robot telemetry (battery %, position, current task, errors) at 1 Hz.
3. Implement a central Node.js / Python backend to aggregate fleet state.
4. Build a React dashboard with Foxglove WebSocket panels for live visualization.
5. Enable remote `cmd_vel` injection via WebSocket for teleoperation.
6. Implement OTA configuration update via MQTT retained messages.
7. Use Zenoh for direct robot-to-robot coordination on shared tasks.

---

### Example 4 — Smart Navigation with Dynamic Obstacle Avoidance

**User Request:**
> Build a fast and adaptive navigation system for a robot operating near moving people.

**Agent Should:**
1. Configure Nav2 Smac Planner for kinematically-feasible global paths.
2. Deploy TEB Local Planner (or MPPI) for smooth, reactive local maneuvering.
3. Fuse LiDAR + depth camera into a merged obstacle costmap.
4. Tune `inflation_radius`, `max_vel_x`, and `acc_lim_x` for safe human proximity.
5. Add a pedestrian detection node (YOLO + tracking) to pre-mark dynamic obstacle zones.
6. Enable real-time path replanning at 10 Hz when new obstacles are detected.

---

### Example 5 — Visual SLAM Robot for Unknown Environments

**User Request:**
> Build a robot that can explore and map a completely unknown indoor environment.

**Agent Should:**
1. Deploy RTAB-Map with RGB-D camera (RealSense D435) and wheel odometry.
2. Configure loop closure detection for drift correction over large maps.
3. Publish 3D occupancy grid to `/map` and `/rtabmap/cloud_map`.
4. Integrate Nav2 frontier exploration plugin for autonomous coverage.
5. Save and export maps as `.pgm` + `.yaml` for re-use in future missions.
6. Optionally fuse with LiDAR for hybrid visual-LiDAR SLAM accuracy.
```
