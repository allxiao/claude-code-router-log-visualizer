import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LogsService } from './logs.service';

@Controller('api/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * Upload and parse log file
   * POST /api/logs/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLog(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const sessionId = await this.logsService.parseLogFile(file.buffer);
      const requests = await this.logsService.getRequestList(sessionId);

      return {
        sessionId,
        requests,
        totalRequests: requests.length,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to parse log file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all requests for a session
   * GET /api/logs/:sessionId/requests
   */
  @Get(':sessionId/requests')
  async getRequests(@Param('sessionId') sessionId: string) {
    const requests = await this.logsService.getRequestList(sessionId);
    return { requests };
  }

  /**
   * Get detailed information for a specific request
   * GET /api/logs/:sessionId/requests/:reqId
   */
  @Get(':sessionId/requests/:reqId')
  async getRequestDetails(
    @Param('sessionId') sessionId: string,
    @Param('reqId') reqId: string,
  ) {
    const details = await this.logsService.getRequestDetails(sessionId, reqId);

    if (!details) {
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }

    return details;
  }
}
