export const committeeProposals = [
  {
    id: 'RP-2026-001',
    title: 'AI-assisted Research Proposal Screening',
    researcherName: 'Anan S.',
    faculty: 'Faculty of Science',
    submissionDate: '2026-03-01',
    status: 'assigned_to_committee',
    statusDisplay: 'ได้รับมอบหมายพิจารณา',
    lastUpdatedAt: '2026-03-02T12:17:00',
    budget: 250000,
    attachments: [
      { name: 'proposal.pdf', mime: 'application/pdf', content: 'Dummy PDF content for RP-2026-001.' }
    ]
  }
]

export const committeeMeetings = [
  {
    _id: 'MT-2026-001',
    title: 'ประชุมคณะกรรมการ ครั้งที่ 1/2569',
    meetingDate: '2026-03-20',
    startTime: '09:00',
    endTime: '11:00',
    location: 'ห้องประชุม 1',
    videoLink: '',
    status: 'scheduled',
    proposalIds: ['RP-2026-001'],
    participantIds: ['committee-1', 'committee-2']
  }
]

export const committeeNotifications = [
  {
    _id: 'NT-2026-001',
    type: 'committee_assigned',
    title: 'ได้รับมอบหมายพิจารณาโครงการ',
    message: 'คุณได้รับมอบหมายให้พิจารณาโครงการ RP-2026-001',
    read: false,
    createdAt: '2026-03-02T12:20:00'
  }
]
