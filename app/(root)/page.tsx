import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return (
      <div>
        <h2>Please sign in to view your interviews.</h2>
      </div>
    );
  }

  const userInterviews = await getInterviewsByUserId(user.id);

  // Separate interviews into completed (with feedback) and pending (without feedback)
  const completed: Interview[] = [];
  const pending: Interview[] = [];

  if (userInterviews && userInterviews.length > 0) {
    // Fetch feedbacks for all interviews in parallel
    const feedbacks = await Promise.all(
      userInterviews.map((interview) =>
        getFeedbackByInterviewId({ interviewId: interview.id, userId: user.id })
      )
    );

    userInterviews.forEach((interview, idx) => {
      if (feedbacks[idx]) {
        completed.push(interview);
      } else {
        pending.push(interview);
      }
    });
  }

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Create an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Pending Interviews</h2>
        <div className="interviews-section">
          {pending.length > 0 ? (
            pending.map((interview) => (
              <InterviewCard
                key={interview.id}
                coverImage={interview.coverImage}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Completed Interviews</h2>
        <div className="interviews-section">
          {completed.length > 0 ? (
            completed.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                coverImage={interview.coverImage}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no completed interviews yet</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
