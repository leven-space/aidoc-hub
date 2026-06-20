import { Test, TestingModule } from '@nestjs/testing';
import { GitService } from './git.service';
import * as fs from 'fs';
import * as path from 'path';

describe('GitService', () => {
  let service: GitService;
  const testReposPath = path.join(__dirname, '../../test-repos-' + Date.now());

  beforeAll(async () => {
    process.env.REPOS_PATH = testReposPath;
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitService],
    }).compile();
    service = module.get<GitService>(GitService);
  });

  afterAll(() => {
    // Cleanup test repos
    if (fs.existsSync(testReposPath)) {
      fs.rmSync(testReposPath, { recursive: true, force: true });
    }
  });

  it('should initialize a repo with main branch', async () => {
    await service.initRepo('ws1', 'repo1');
    const repoPath = service.getRepoPath('ws1', 'repo1');
    expect(fs.existsSync(repoPath)).toBe(true);
    expect(fs.existsSync(path.join(repoPath, '.git'))).toBe(true);
  });

  it('should commit files and generate new version', async () => {
    await service.initRepo('ws1', 'repo1');
    const result = await service.commitFiles(
      'ws1',
      'repo1',
      [{ filePath: 'test.html', content: '<h1>Hello</h1>' }],
      'Add test file',
      'testuser',
    );
    expect(result.oid).toBeDefined();
    expect(result.message).toBe('Add test file');
    expect(result.author).toBe('testuser');
  });

  it('should get latest version', async () => {
    await service.initRepo('ws1', 'repo2');
    await service.commitFiles(
      'ws1',
      'repo2',
      [{ filePath: 'index.html', content: '<h1>Index</h1>' }],
      'Add index',
      'testuser',
    );
    const latest = await service.getLatestVersion('ws1', 'repo2');
    expect(latest).toBeDefined();
    expect(latest!.oid).toBeDefined();
    expect(latest!.message.trim()).toBe('Add index');
  });

  it('should get history in reverse chronological order', async () => {
    await service.initRepo('ws1', 'repo3');
    await service.commitFiles(
      'ws1',
      'repo3',
      [{ filePath: 'v1.html', content: 'v1' }],
      'Version 1',
      'user1',
    );
    await service.commitFiles(
      'ws1',
      'repo3',
      [{ filePath: 'v2.html', content: 'v2' }],
      'Version 2',
      'user2',
    );
    const history = await service.getHistory('ws1', 'repo3');
    expect(history.length).toBeGreaterThanOrEqual(2);
    // Most recent should be first
    expect(history[0].message).toContain('Version 2');
  });

  it('should detect concurrent conflict', async () => {
    await service.initRepo('ws1', 'repo4');
    const first = await service.commitFiles(
      'ws1',
      'repo4',
      [{ filePath: 'a.html', content: 'a' }],
      'First',
      'user1',
    );

    // Commit a second version
    await service.commitFiles(
      'ws1',
      'repo4',
      [{ filePath: 'b.html', content: 'b' }],
      'Second',
      'user2',
    );

    // Try to commit based on first version (conflict!)
    await expect(
      service.commitFiles(
        'ws1',
        'repo4',
        [{ filePath: 'c.html', content: 'c' }],
        'Third',
        'user3',
        first.oid,
        false,
      ),
    ).rejects.toThrow();
  });

  it('should allow force overwrite on conflict', async () => {
    await service.initRepo('ws1', 'repo5');
    const first = await service.commitFiles(
      'ws1',
      'repo5',
      [{ filePath: 'a.html', content: 'a' }],
      'First',
      'user1',
    );

    await service.commitFiles(
      'ws1',
      'repo5',
      [{ filePath: 'b.html', content: 'b' }],
      'Second',
      'user2',
    );

    const result = await service.commitFiles(
      'ws1',
      'repo5',
      [{ filePath: 'c.html', content: 'c' }],
      'Force Third',
      'user3',
      first.oid,
      true,
    );
    expect(result.oid).toBeDefined();
  });

  it('should read file at specific version', async () => {
    await service.initRepo('ws1', 'repo6');
    await service.commitFiles(
      'ws1',
      'repo6',
      [{ filePath: 'page.html', content: '<h1>V1</h1>' }],
      'V1',
      'user1',
    );
    const v1 = await service.getLatestVersion('ws1', 'repo6');

    await service.commitFiles(
      'ws1',
      'repo6',
      [{ filePath: 'page.html', content: '<h1>V2</h1>' }],
      'V2',
      'user1',
    );

    // Read at v1
    const content = await service.readFileAtVersion(
      'ws1',
      'repo6',
      'page.html',
      v1!.oid,
    );
    expect(content).toBe('<h1>V1</h1>');

    // Read latest
    const latest = await service.readFileAtVersion('ws1', 'repo6', 'page.html');
    expect(latest).toBe('<h1>V2</h1>');
  });

  it('should restore a specific version as new commit', async () => {
    await service.initRepo('ws1', 'repo7');
    await service.commitFiles(
      'ws1',
      'repo7',
      [{ filePath: 'data.html', content: 'original' }],
      'Original',
      'user1',
    );
    const v1 = await service.getLatestVersion('ws1', 'repo7');

    await service.commitFiles(
      'ws1',
      'repo7',
      [{ filePath: 'data.html', content: 'modified' }],
      'Modified',
      'user1',
    );

    const restored = await service.restoreVersion(
      'ws1',
      'repo7',
      v1!.oid,
      'user2',
    );
    expect(restored.oid).toBeDefined();

    const currentContent = await service.readFileAtVersion(
      'ws1',
      'repo7',
      'data.html',
    );
    expect(currentContent).toBe('original');
  });

  it('should remove files added after target version on restore', async () => {
    await service.initRepo('ws1', 'repo8');
    await service.commitFiles(
      'ws1',
      'repo8',
      [{ filePath: 'a.html', content: 'v1' }],
      'V1',
      'user1',
    );
    const v1 = await service.getLatestVersion('ws1', 'repo8');

    await service.commitFiles(
      'ws1',
      'repo8',
      [
        { filePath: 'a.html', content: 'v2' },
        { filePath: 'b.html', content: 'extra' },
      ],
      'V2',
      'user1',
    );

    await service.restoreVersion('ws1', 'repo8', v1!.oid, 'user2');

    const files = await service.listFiles('ws1', 'repo8');
    expect(files).toEqual(['a.html']);
    await expect(
      service.readFileAtVersion('ws1', 'repo8', 'b.html'),
    ).rejects.toThrow();
  });
});
