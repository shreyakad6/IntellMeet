import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Meeting } from '../models/Meeting.js';
import { Transcript } from '../models/Transcript.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import { ActionItem } from '../models/ActionItem.js';
import { Workspace } from '../models/Workspace.js';
import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { Message } from '../models/Message.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Meeting.deleteMany({});
    await Transcript.deleteMany({});
    await MeetingSummary.deleteMany({});
    await ActionItem.deleteMany({});
    await Workspace.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await Message.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const userAlex = await User.create({
      name: 'Alex Rivera',
      email: 'alex.admin@intellmeet.io',
      passwordHash,
      role: 'admin',
      department: 'Engineering Leadership',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });

    const userSarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.dev@intellmeet.io',
      passwordHash,
      role: 'member',
      department: 'Frontend Architecture',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    });

    const userMarcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.ops@intellmeet.io',
      passwordHash,
      role: 'member',
      department: 'Cloud & Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    });

    const userPriya = await User.create({
      name: 'Priya Patel',
      email: 'priya.sec@intellmeet.io',
      passwordHash,
      role: 'member',
      department: 'Security & Compliance',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    });

    console.log('[Seed] Creating workspace...');
    const workspace = await Workspace.create({
      name: 'Core Platform Engineering',
      description: 'Central engineering workspace for distributed services, real-time WebRTC, and AI pipelines.',
      owner: userAlex._id,
      members: [
        { user: userAlex._id, role: 'admin', joinedAt: new Date() },
        { user: userSarah._id, role: 'member', joinedAt: new Date() },
        { user: userMarcus._id, role: 'member', joinedAt: new Date() },
        { user: userPriya._id, role: 'member', joinedAt: new Date() }
      ]
    });

    console.log('[Seed] Creating demo meetings...');
    // 1. Completed meeting with summary, transcript, and action items
    const completedMeeting = await Meeting.create({
      title: 'Q4 Real-Time WebRTC & Cloud Migration Architecture Sync',
      description: 'Strategic architectural review covering WebRTC latency optimizations, MongoDB indexing, and canary deployments.',
      meetingCode: 'INT-492-810',
      host: userAlex._id,
      workspaceId: workspace._id,
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 42 * 60 * 1000), // 42 min
      status: 'completed',
      duration: 2520, // 42 minutes in seconds
      hasTranscript: true,
      hasSummary: true,
      actionItemCount: 3,
      participants: [
        { user: userAlex._id, name: userAlex.name, avatar: userAlex.avatar, isHost: true },
        { user: userSarah._id, name: userSarah.name, avatar: userSarah.avatar, isHost: false },
        { user: userMarcus._id, name: userMarcus.name, avatar: userMarcus.avatar, isHost: false },
        { user: userPriya._id, name: userPriya.name, avatar: userPriya.avatar, isHost: false }
      ]
    });

    // Transcript for completed meeting
    const transcript = await Transcript.create({
      meetingId: completedMeeting._id,
      fullText:
        'Alex Rivera opened the session reviewing WebRTC connection stats, noting a 35% latency drop after optimizing ICE candidate gathering. Sarah Chen confirmed the database migration is complete and all query performance indexes are verified. Priya Patel emphasized that the OAuth 2.0 refresh token rotation policy must be finalized and reviewed by Friday. Marcus Vance stated he will update the Helm charts and deploy the canary build to staging tomorrow morning. Finally, Alex confirmed that release v1.2 code freeze is set for next Tuesday at 5 PM.',
      entries: [
        {
          speakerId: userAlex._id,
          speakerName: 'Alex Rivera (Host)',
          timestamp: '00:15',
          text: 'Good morning everyone, lets review our real-time infrastructure benchmarks and sprint deliverables.',
          confidence: 0.99
        },
        {
          speakerId: userAlex._id,
          speakerName: 'Alex Rivera (Host)',
          timestamp: '01:40',
          text: 'Our WebRTC peer connection latency dropped by 35% after streamlining STUN/TURN ICE candidate gathering.',
          confidence: 0.98
        },
        {
          speakerId: userSarah._id,
          speakerName: 'Sarah Chen',
          timestamp: '04:12',
          text: 'The database collections are completely indexed in MongoDB and our read latencies are under 15 milliseconds.',
          confidence: 0.97
        },
        {
          speakerId: userPriya._id,
          speakerName: 'Priya Patel',
          timestamp: '08:30',
          text: 'We must finalize the OAuth 2.0 refresh token rotation policy and security review by this Friday.',
          confidence: 0.98
        },
        {
          speakerId: userMarcus._id,
          speakerName: 'Marcus Vance',
          timestamp: '12:45',
          text: 'I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.',
          confidence: 0.99
        },
        {
          speakerId: userAlex._id,
          speakerName: 'Alex Rivera (Host)',
          timestamp: '18:20',
          text: 'Excellent work team. Code freeze for release v1.2 is officially scheduled for next Tuesday at 5 PM.',
          confidence: 0.99
        }
      ],
      isDemoMode: true,
      audioDurationSeconds: 2520
    });

    // Meeting Summary for completed meeting
    await MeetingSummary.create({
      meetingId: completedMeeting._id,
      summary:
        'The engineering sync reviewed significant performance gains in WebRTC signaling latency, successful completion of database migration with validated indexing, and key upcoming release milestones. Security standards around token rotation were agreed upon, with canary deployment via Helm scheduled for staging tomorrow.',
      keyPoints: [
        'WebRTC signaling and ICE candidate optimization resulted in a 35% latency reduction across multi-peer meshes.',
        'Database transition to MongoDB confirmed stable with sub-15ms query latencies under load.',
        'OAuth 2.0 refresh token rotation policy undergoing final security review prior to Friday.',
        'Canary staging deployment prepared using updated Helm charts and Kubernetes ingress.'
      ],
      decisions: [
        'Approved deployment of the staging canary build tomorrow morning at 10:00 AM.',
        'Finalized release v1.2 code freeze date for next Tuesday at 5:00 PM.',
        'Adopted mandatory token rotation standard for all enterprise API sessions.'
      ],
      topicsCovered: ['Real-time WebRTC Performance', 'Database Verification', 'Authentication Security', 'Release Timeline'],
      sentiment: 'constructive',
      generatedByAi: true,
      isDemoMode: true,
      modelUsed: 'OpenAI GPT-4o-mini (Enterprise Fallback)'
    });

    // Action items for completed meeting
    const action1 = await ActionItem.create({
      task: 'Update Helm charts and trigger canary deployment to staging',
      description: 'Deploy the latest container images to staging cluster and monitor error rates.',
      assignee: userMarcus._id,
      assigneeName: 'Marcus Vance',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'high',
      status: 'in_progress',
      meetingId: completedMeeting._id,
      workspaceId: workspace._id,
      extractedByAi: true
    });

    const action2 = await ActionItem.create({
      task: 'Finalize OAuth 2.0 refresh token rotation policy',
      description: 'Complete security review and merge token rotation middleware.',
      assignee: userPriya._id,
      assigneeName: 'Priya Patel',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      priority: 'urgent',
      status: 'pending',
      meetingId: completedMeeting._id,
      workspaceId: workspace._id,
      extractedByAi: true
    });

    const action3 = await ActionItem.create({
      task: 'Enforce v1.2 code freeze and tag release candidate',
      description: 'Block non-critical pull requests and prepare release notes.',
      assignee: userAlex._id,
      assigneeName: 'Alex Rivera',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      status: 'pending',
      meetingId: completedMeeting._id,
      workspaceId: workspace._id,
      extractedByAi: true
    });

    // In-meeting Chat messages for completed meeting
    await Message.create([
      {
        meetingId: completedMeeting._id,
        meetingCode: 'INT-492-810',
        sender: userAlex._id,
        senderName: userAlex.name,
        senderAvatar: userAlex.avatar,
        content: 'Welcome team! Starting the architecture sync now.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000)
      },
      {
        meetingId: completedMeeting._id,
        meetingCode: 'INT-492-810',
        sender: userSarah._id,
        senderName: userSarah.name,
        senderAvatar: userSarah.avatar,
        content: 'Audio and video are crystal clear on my end.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000)
      },
      {
        meetingId: completedMeeting._id,
        meetingCode: 'INT-492-810',
        sender: userMarcus._id,
        senderName: userMarcus.name,
        senderAvatar: userMarcus.avatar,
        content: 'Helm values are committed in branch infra/canary-v1.2.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 1000)
      }
    ]);

    // 2. Active Meeting ready for immediate testing
    await Meeting.create({
      title: 'Active Team Standup & Live Screen Share',
      description: 'Ongoing live collaboration room for peer testing, audio/video controls, and chat.',
      meetingCode: 'INT-101-202',
      host: userAlex._id,
      workspaceId: workspace._id,
      scheduledAt: new Date(),
      startedAt: new Date(Date.now() - 10 * 60 * 1000), // started 10m ago
      status: 'active',
      duration: 600,
      hasTranscript: false,
      hasSummary: false,
      actionItemCount: 0,
      participants: [
        { user: userAlex._id, name: userAlex.name, avatar: userAlex.avatar, isHost: true }
      ]
    });

    // 3. Upcoming Scheduled Meetings
    await Meeting.create({
      title: 'Sprint 24 Planning & Technical Debt Backlog',
      description: 'Quarterly backlog grooming, priority review, and resource allocation across pods.',
      meetingCode: 'INT-883-491',
      host: userSarah._id,
      workspaceId: workspace._id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      status: 'scheduled',
      hasTranscript: false,
      hasSummary: false,
      actionItemCount: 0,
      participants: [
        { user: userSarah._id, name: userSarah.name, avatar: userSarah.avatar, isHost: true }
      ]
    });

    await Meeting.create({
      title: 'Security Compliance & Threat Modeling Review',
      description: 'Annual penetration testing review, TLS cipher auditing, and credential rotation validation.',
      meetingCode: 'INT-734-629',
      host: userPriya._id,
      workspaceId: workspace._id,
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      status: 'scheduled',
      hasTranscript: false,
      hasSummary: false,
      actionItemCount: 0,
      participants: [
        { user: userPriya._id, name: userPriya.name, avatar: userPriya.avatar, isHost: true }
      ]
    });

    console.log('[Seed] Creating Kanban Tasks...');
    await Task.create([
      {
        title: 'Configure Prometheus scrape config for backend metrics',
        description: 'Ensure /metrics endpoint is queried every 15s with appropriate alerting thresholds.',
        workspaceId: workspace._id,
        assignee: userMarcus._id,
        reporter: userAlex._id,
        priority: 'high',
        status: 'todo',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['DevOps', 'Observability'],
        order: 0
      },
      {
        title: 'Audit WebRTC ICE candidate gathering on low-bandwidth networks',
        description: 'Verify STUN/TURN fallback works seamlessly when UDP ports 3478 are restricted.',
        workspaceId: workspace._id,
        assignee: userSarah._id,
        reporter: userAlex._id,
        priority: 'urgent',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['WebRTC', 'Network'],
        order: 0
      },
      {
        title: 'Implement refresh token blacklisting in Redis store',
        description: 'Store invalidated tokens upon logout with TTL matching token lifespan.',
        workspaceId: workspace._id,
        assignee: userPriya._id,
        reporter: userAlex._id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        tags: ['Security', 'Authentication'],
        order: 1
      },
      {
        title: 'Verify MongoDB schema indexes for meeting search',
        description: 'Create compound indexes on host, status, and scheduledAt for sub-5ms query execution.',
        workspaceId: workspace._id,
        assignee: userSarah._id,
        reporter: userAlex._id,
        priority: 'medium',
        status: 'done',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ['Database', 'Optimization'],
        order: 0
      }
    ]);

    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        recipient: userAlex._id,
        title: 'AI Summary Ready',
        message: 'Summary and key decisions are ready for "Q4 Real-Time WebRTC Architecture Sync"',
        type: 'meeting_summary_ready',
        relatedMeetingId: completedMeeting._id,
        isRead: false
      },
      {
        recipient: userAlex._id,
        title: 'Upcoming Meeting in 30 minutes',
        message: 'Active Team Standup is starting soon. Meeting Code: INT-101-202',
        type: 'meeting_starting',
        isRead: false
      },
      {
        recipient: userAlex._id,
        title: 'Action Item Assigned',
        message: 'You have a pending action item: "Enforce v1.2 code freeze and tag release candidate"',
        type: 'action_item_assigned',
        relatedMeetingId: completedMeeting._id,
        isRead: true
      }
    ]);

    console.log('====================================================');
    console.log('✅ SEEDING COMPLETE!');
    console.log('Demo Accounts:');
    console.log('  Admin:  alex.admin@intellmeet.io  /  Password123!');
    console.log('  Member: sarah.dev@intellmeet.io   /  Password123!');
    console.log('  Member: marcus.ops@intellmeet.io  /  Password123!');
    console.log('  Member: priya.sec@intellmeet.io   /  Password123!');
    console.log('Active Meeting Code: INT-101-202');
    console.log('Completed Meeting Code: INT-492-810 (has transcript, AI summary & action items)');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
