import { AuthProvider } from '@/contexts/AuthContext';
import {
  useApplications,
  useRegenerateRoadmap,
  useRoadmap,
} from '@/services/applications/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoadmapPage } from './roadmap';

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

// Authed-page trap: never let the test hit /users/me for real (a live call
// would 401 and cascade into the login redirect).
vi.mock('@/services/users/http', () => ({
  fetchMyProfile: vi.fn().mockResolvedValue({ username: 'alice' }),
  updateMyProfile: vi.fn(),
  deleteMyAccount: vi.fn(),
  uploadMyCV: vi.fn(),
}));

vi.mock('@/services/applications/hooks', () => ({
  useApplications: vi.fn(),
  useRoadmap: vi.fn(),
  useRegenerateRoadmap: vi.fn(),
  useUpdateApplicationInterviewAt: vi.fn(() => ({ mutate: vi.fn() })),
}));

const application = {
  applicationId: 'app-1',
  companyName: 'Datadog',
  jobTitle: 'SRE',
  status: 'sent' as const,
  offerUrl: 'https://example.com/job',
  offerDetails: null,
  cvDetails: {
    desired_job: 'Reliability Engineer',
    resume: 'Infra-focused.',
    experiences: [],
    education: [],
    technical_skills: ['Kubernetes'],
    languages: [],
  },
  appliedAt: '2026-07-09T00:00:00.000Z',
  interviewAt: null,
  updatedAt: '2026-07-09T00:00:00.000Z',
};

const roadmap = {
  match_score: 62,
  summary: 'Close the Kubernetes gap.',
  topics: [
    {
      title: 'Kubernetes fundamentals',
      priority: 'HIGH' as const,
      rationale: 'Required by the offer, absent from the CV.',
      gap: true,
    },
  ],
};

const mockRegenerate = vi.fn();

// Contingency (per brief): the mini route tree only contains the roadmap
// route, and router.load() would not match the nested
// /applications/app-1/roadmap path from a bare createFileRoute tree here.
// Render RoadmapPage directly through a root route instead.
const router = createRouter({
  routeTree: createRootRoute({
    component: () => <RoadmapPage applicationId="app-1" />,
  }),
  history: createMemoryHistory(),
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>,
  );
};

describe('ApplicationRoadmap (roadmap page)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(useApplications).mockReturnValue({
      data: [application],
      isLoading: false,
    } as unknown as ReturnType<typeof useApplications>);
    vi.mocked(useRoadmap).mockReturnValue({
      data: roadmap,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);
    vi.mocked(useRegenerateRoadmap).mockReturnValue({
      mutate: mockRegenerate,
      isPending: false,
    } as unknown as ReturnType<typeof useRegenerateRoadmap>);

    await act(async () => {
      await router.load();
    });
  });

  it('renders heading, summary, timeline and gauge in the ready state', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: /SRE at Datadog/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Close the Kubernetes gap.')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes fundamentals')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('points the CTAs at the simulation and notes routes', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    const simLink = await screen.findByRole('link', {
      name: /start simulation/i,
    });
    expect(simLink).toHaveAttribute('href', '/applications/app-1/simulations');
    expect(screen.getByRole('link', { name: /my notes/i })).toHaveAttribute(
      'href',
      '/notes',
    );
  });

  it('renders the loading state', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByText(/building your preparation path/i),
    ).toBeInTheDocument();
  });

  it('renders the error state and retries via regenerate', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    const retry = await screen.findByRole('button', { name: /retry/i });
    fireEvent.click(retry);
    expect(mockRegenerate).toHaveBeenCalled();
  });

  it('surfaces a regenerate failure from the error state', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useRoadmap>);
    vi.mocked(useRegenerateRoadmap).mockReturnValue({
      mutate: mockRegenerate,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useRegenerateRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByText(/couldn't regenerate — try again in a minute/i),
    ).toBeInTheDocument();
  });

  it('renders the empty state when there is nothing to analyze', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: { match_score: 0, summary: '', topics: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByText(/analyze an offer first/i),
    ).toBeInTheDocument();
  });

  it('offers a regenerate CTA when an offer was analyzed but the roadmap is empty', async () => {
    vi.mocked(useApplications).mockReturnValue({
      data: [{ ...application, offerDetails: { job_title: 'SRE' } }],
      isLoading: false,
    } as unknown as ReturnType<typeof useApplications>);
    vi.mocked(useRoadmap).mockReturnValue({
      data: { match_score: 0, summary: '', topics: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByText(/couldn't build a path from this offer yet/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/analyze an offer first/i),
    ).not.toBeInTheDocument();
  });

  it('calls regenerate from the footer action', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    fireEvent.click(await screen.findByRole('button', { name: /regenerate/i }));
    expect(mockRegenerate).toHaveBeenCalled();
  });

  it('shows an inline error when regenerate fails', async () => {
    vi.mocked(useRegenerateRoadmap).mockReturnValue({
      mutate: mockRegenerate,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useRegenerateRoadmap>);
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByText(/couldn't regenerate — try again in a minute/i),
    ).toBeInTheDocument();
  });

  it('hides the talking-points tab when the roadmap has none', async () => {
    // Default fixture has no talking_points → single view, no tablist.
    renderWithProviders(<RouterProvider router={router} />);
    await screen.findByText('Kubernetes fundamentals');
    expect(
      screen.queryByRole('tab', { name: /interview talking points/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a talking-points tab and switches to it when points exist', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: {
        ...roadmap,
        talking_points: [
          {
            mission: 'Own the deployment pipeline',
            angle: "You've run GitHub Actions, so you'd start there.",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);

    renderWithProviders(<RouterProvider router={router} />);

    // Path tab shows the timeline first; the talking point is not yet visible.
    await screen.findByText('Kubernetes fundamentals');
    expect(
      screen.queryByText('Own the deployment pipeline'),
    ).not.toBeInTheDocument();

    // Switching to the talking-points tab reveals it.
    fireEvent.click(
      screen.getByRole('tab', { name: /interview talking points/i }),
    );
    expect(screen.getByText('Own the deployment pipeline')).toBeInTheDocument();
  });

  it('wires the ARIA tabs contract and roving arrow-key focus', async () => {
    vi.mocked(useRoadmap).mockReturnValue({
      data: {
        ...roadmap,
        talking_points: [
          {
            mission: 'Own the deployment pipeline',
            angle: "You've run GitHub Actions, so you'd start there.",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRoadmap>);

    renderWithProviders(<RouterProvider router={router} />);

    const pathTab = await screen.findByRole('tab', {
      name: /preparation path/i,
    });
    const talkingTab = screen.getByRole('tab', {
      name: /interview talking points/i,
    });

    // Each tab controls a panel; the active panel is labelled by its tab.
    expect(pathTab).toHaveAttribute('aria-controls', 'roadmap-panel-path');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'roadmap-tab-path',
    );

    // Roving tabindex: only the active tab is in the tab order.
    expect(pathTab).toHaveAttribute('tabindex', '0');
    expect(talkingTab).toHaveAttribute('tabindex', '-1');

    // ArrowRight moves selection + focus to the next tab.
    fireEvent.keyDown(pathTab, { key: 'ArrowRight' });
    expect(talkingTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'roadmap-tab-talking',
    );
  });

  it('shows the Sources button when the application is loaded', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('button', { name: /^sources$/i }),
    ).toBeInTheDocument();
  });

  it('opens the sources modal on click', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    fireEvent.click(await screen.findByRole('button', { name: /^sources$/i }));
    const dialog = await screen.findByRole('dialog');
    // The page <h1> ALSO renders "SRE at Datadog"; scope to the dialog so the
    // query is unambiguous.
    expect(within(dialog).getByText('SRE at Datadog')).toBeInTheDocument();
  });

  it('hides the Sources button when the application is not in cache', async () => {
    vi.mocked(useApplications).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useApplications>);
    renderWithProviders(<RouterProvider router={router} />);
    // Wait for the roadmap heading to settle, then assert the button is absent.
    await screen.findByRole('heading', {
      name: /SRE at Datadog|preparation path/i,
    });
    expect(
      screen.queryByRole('button', { name: /^sources$/i }),
    ).not.toBeInTheDocument();
  });
});
