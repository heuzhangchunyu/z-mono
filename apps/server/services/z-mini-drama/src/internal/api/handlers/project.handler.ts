import type { Context } from 'koa';
import type { AuthenticatedUser } from '../../model/auth.js';
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ListProjectsResponse,
  ProjectResponse
} from '../../model/project.js';
import { ProjectRepository } from '../../repository/project.repository.js';

const MAX_PROJECT_NAME_LENGTH = 40;
const MAX_PROJECT_DESCRIPTION_LENGTH = 1000;
const MAX_GLOBAL_ART_STYLE_LENGTH = 1000;

export class ProjectHandler {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async createProject(ctx: Context) {
    const authenticatedUser = ctx.state.user as AuthenticatedUser | undefined;
    if (!authenticatedUser) {
      ctx.status = 401;
      ctx.body = {
        error: '未登录'
      };
      return;
    }

    const requestBody = await readCreateProjectRequest(ctx);
    if (!requestBody) {
      return;
    }

    const validationMessage = validateCreateProjectRequest(requestBody);
    if (validationMessage) {
      ctx.status = 400;
      ctx.body = {
        error: validationMessage
      };
      return;
    }

    const createdProject = await this.projectRepository.createProject(
      {
        name: requestBody.name.trim(),
        description: requestBody.description?.trim() ?? '',
        aspectRatio: normalizeOptionalText(requestBody.aspect_ratio),
        globalArtStyle: normalizeOptionalText(requestBody.global_art_style)
      },
      authenticatedUser.id
    );

    const responseBody: CreateProjectResponse = {
      message: '项目创建成功',
      data: mapProjectResponse(createdProject)
    };

    ctx.status = 201;
    ctx.body = responseBody;
  }

  async listProjects(ctx: Context) {
    const authenticatedUser = ctx.state.user as AuthenticatedUser | undefined;
    if (!authenticatedUser) {
      ctx.status = 401;
      ctx.body = {
        error: '未登录'
      };
      return;
    }

    const page = readPositiveIntegerQuery(ctx, 'page', 1);
    const pageSize = readPositiveIntegerQuery(ctx, 'page_size', 20, 100);
    const name = readStringQuery(ctx, 'name').trim();

    const result = await this.projectRepository.listProjects({
      userId: authenticatedUser.id,
      userRole: authenticatedUser.role,
      page,
      pageSize,
      name
    });

    const responseBody: ListProjectsResponse = {
      data: result.items.map(mapProjectResponse),
      total: result.total,
      page,
      page_size: pageSize
    };

    ctx.body = responseBody;
  }
}

async function readCreateProjectRequest(ctx: Context) {
  try {
    const requestBody = await readJsonBody<Partial<CreateProjectRequest>>(ctx);
    return {
      name: typeof requestBody.name === 'string' ? requestBody.name : '',
      description: typeof requestBody.description === 'string' ? requestBody.description : '',
      aspect_ratio: typeof requestBody.aspect_ratio === 'string' ? requestBody.aspect_ratio : '',
      global_art_style: typeof requestBody.global_art_style === 'string' ? requestBody.global_art_style : ''
    } satisfies CreateProjectRequest;
  } catch {
    ctx.status = 400;
    ctx.body = {
      error: '请求体必须是合法 JSON'
    };
    return null;
  }
}

async function readJsonBody<T>(ctx: Context) {
  const chunks: Buffer[] = [];

  for await (const chunk of ctx.req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function validateCreateProjectRequest(request: CreateProjectRequest) {
  const normalizedName = request.name.trim();

  if (!normalizedName) {
    return '项目名称不能为空';
  }

  if (normalizedName.length > MAX_PROJECT_NAME_LENGTH) {
    return `项目名称不能超过 ${MAX_PROJECT_NAME_LENGTH} 个字符`;
  }

  if ((request.description?.trim().length ?? 0) > MAX_PROJECT_DESCRIPTION_LENGTH) {
    return `项目描述不能超过 ${MAX_PROJECT_DESCRIPTION_LENGTH} 个字符`;
  }

  if ((request.global_art_style?.trim().length ?? 0) > MAX_GLOBAL_ART_STYLE_LENGTH) {
    return `全局画风设定不能超过 ${MAX_GLOBAL_ART_STYLE_LENGTH} 个字符`;
  }

  if (request.aspect_ratio && !['16:9', '9:16', '1:1'].includes(request.aspect_ratio.trim())) {
    return '画幅比例仅支持 16:9、9:16 或 1:1';
  }

  return null;
}

function readPositiveIntegerQuery(ctx: Context, queryKey: string, fallbackValue: number, maxValue?: number) {
  const rawValue = readStringQuery(ctx, queryKey);
  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  if (typeof maxValue === 'number' && parsedValue > maxValue) {
    return maxValue;
  }

  return parsedValue;
}

function readStringQuery(ctx: Context, queryKey: string) {
  const queryValue = ctx.query[queryKey];
  return typeof queryValue === 'string' ? queryValue : '';
}

function normalizeOptionalText(rawValue: string | undefined) {
  const normalizedValue = rawValue?.trim() ?? '';
  return normalizedValue ? normalizedValue : null;
}

function mapProjectResponse(project: Parameters<typeof mapProjectResponseFromRecord>[0]): ProjectResponse {
  return mapProjectResponseFromRecord(project);
}

function mapProjectResponseFromRecord(project: {
  id: number;
  name: string;
  description: string;
  status: string;
  aspectRatio: string | null;
  globalArtStyle: string | null;
  visualAssetDescription: unknown[];
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectResponse['status'],
    aspect_ratio: project.aspectRatio,
    global_art_style: project.globalArtStyle,
    visual_asset_description: project.visualAssetDescription,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  } satisfies ProjectResponse;
}
