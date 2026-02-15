import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Try to get the last commit timestamp from git
    const { stdout } = await execAsync('git log -1 --format="%at" main 2>/dev/null || git log -1 --format="%at" HEAD');
    const timestamp = parseInt(stdout.trim(), 10);

    if (isNaN(timestamp)) {
      // Fallback to build time if git is not available
      return NextResponse.json({
        deployedAt: Date.now(),
        isFallback: true
      });
    }

    return NextResponse.json({
      deployedAt: timestamp * 1000, // Convert to milliseconds
      isFallback: false
    });
  } catch {
    // If git is not available, return current time as fallback
    return NextResponse.json({
      deployedAt: Date.now(),
      isFallback: true
    });
  }
}
