import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { User, Course, CourseStudentRef } from './models';
import { AppSource } from '../config';
import { v4 as uuidv4 } from 'uuid';

const uniqueArray = <T>(arr: T[]): T[] => {
    return Array.from(new Set(arr));
};

@Injectable()
export class TemporaryMonolithicService {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly courseRepository: Repository<Course>,
        private readonly courseStudentRefRepository: Repository<CourseStudentRef>,
    ) {}

    async getUserById(
        id: string,
        shouldIncludeDeleted: boolean = false,
    ): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: {
                    id,
                    isDeleted: shouldIncludeDeleted ? undefined : false,
                },
            });
        } catch (error) {
            console.error('Error getting user by id:', error);
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    async createUser(
        nfcCardId: string,
        name: string,
        isStudent: boolean,
        isTeacher: boolean,
        teacherId: string,
        createdBy: string,
    ): Promise<User> {
        try {
            const now = new Date();
            const id = uuidv4();
            const user = this.userRepository.create({
                id,
                nfcCardId,
                name,
                isStudent,
                isTeacher,
                teacherId,
                creationSource: AppSource.NEST_BACKEND,
                createdBy,
                createdAt: now,
                updateSource: AppSource.NEST_BACKEND,
                updatedBy: createdBy,
                updatedAt: now,
                isDeleted: false,
            });
            return await this.userRepository.save(user);
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    async getUserByNfcCardId(nfcCardId: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: { nfcCardId, isDeleted: false },
            });
        } catch (error) {
            console.error('Error getting user by NFC card id:', error);
            throw new Error(`Failed to get user by NFC card: ${error.message}`);
        }
    }

    async getUsersByTeacherId(
        teacherId: string,
        shouldIncludeDeleted: boolean = false,
    ): Promise<User[]> {
        try {
            return await this.userRepository.find({
                where: {
                    teacherId,
                    isDeleted: shouldIncludeDeleted ? undefined : false,
                },
            });
        } catch (error) {
            console.error('Error getting users by teacher id:', error);
            throw new Error(`Failed to get users by teacher: ${error.message}`);
        }
    }

    async updateUser(
        id: string,
        nfcCardId: string | null,
        name: string | null,
        teacherId: string | null,
        updatedBy: string,
    ): Promise<void> {
        const now = new Date();
        try {
            const updateData: Record<string, any> = {
                updateSource: AppSource.NEST_BACKEND,
                updatedBy,
                updatedAt: now,
            };

            if (nfcCardId) {
                updateData.nfcCardId = nfcCardId;
            }
            if (name) {
                updateData.name = name;
            }
            if (teacherId) {
                updateData.teacherId = teacherId;
            }

            await this.userRepository.update(id, updateData);
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    async deleteUsers(ids: string[], deleter: string): Promise<void> {
        const now = new Date();
        if (ids.length === 0) {
            return;
        }
        ids = uniqueArray(ids);
        try {
            await this.userRepository.update(ids, {
                isDeleted: true,
                updateSource: AppSource.NEST_BACKEND,
                updatedBy: deleter,
                updatedAt: now,
            });
        } catch (error) {
            console.error('Error deleting users:', error);
            throw new Error(`Failed to delete users: ${error.message}`);
        }
    }

    async getCourseById(
        id: string,
        shouldIncludeDeleted: boolean = false,
    ): Promise<Course | null> {
        const courses = await this.getCoursesByIds([id], shouldIncludeDeleted);
        if (courses.length === 0) {
            return null;
        }
        return courses[0];
    }

    async getCoursesByIds(
        ids: string[],
        shouldIncludeDeleted: boolean = false,
    ): Promise<Course[]> {
        if (ids.length === 0) {
            return [];
        }
        ids = uniqueArray(ids);
        try {
            return await this.courseRepository.find({
                where: {
                    id: In(ids),
                    isDeleted: shouldIncludeDeleted ? undefined : false,
                },
            });
        } catch (error) {
            console.error('Error getting courses by ids:', error);
            throw new Error(`Failed to get courses: ${error.message}`);
        }
    }

    async getCoursesByTeacherIds(
        teacherIds: string[],
        shouldIncludeDeleted: boolean = false,
    ): Promise<Course[]> {
        if (teacherIds.length === 0) {
            return [];
        }
        teacherIds = uniqueArray(teacherIds);
        try {
            return await this.courseRepository.find({
                where: {
                    teacherId: In(teacherIds),
                    isDeleted: shouldIncludeDeleted ? undefined : false,
                },
            });
        } catch (error) {
            console.error('Error getting courses by teacher id:', error);
            throw new Error(
                `Failed to get courses by teacher: ${error.message}`,
            );
        }
    }

    async createCourse(
        name: string,
        teacherId: string,
        createdBy: string,
    ): Promise<Course> {
        try {
            const now = new Date();
            const id = uuidv4();
            const course = this.courseRepository.create({
                id,
                name,
                teacherId,
                creationSource: AppSource.NEST_BACKEND,
                createdBy,
                createdAt: now.getTime(),
                updateSource: AppSource.NEST_BACKEND,
                updatedBy: createdBy,
                updatedAt: now.getTime(),
                isDeleted: false,
            });

            return await this.courseRepository.save(course);
        } catch (error) {
            console.error('Error creating course:', error);
            throw new Error(`Failed to create course: ${error.message}`);
        }
    }

    async updateCourse(
        id: string,
        name: string | null,
        updatedBy: string,
    ): Promise<void> {
        const now = new Date();
        try {
            const updateData: Record<string, any> = {
                updateSource: AppSource.NEST_BACKEND,
                updatedBy,
                updatedAt: now,
            };

            if (name) updateData.name = name;

            await this.courseRepository.update(id, updateData);
        } catch (error) {
            console.error('Error updating course:', error);
            throw new Error(`Failed to update course: ${error.message}`);
        }
    }

    async deleteCourses(ids: string[], deleter: string): Promise<void> {
        if (ids.length === 0) {
            return;
        }
        ids = uniqueArray(ids);
        const now = new Date();
        try {
            await this.courseRepository.update(ids, {
                isDeleted: true,
                updateSource: AppSource.NEST_BACKEND,
                updatedBy: deleter,
                updatedAt: now.getTime(),
            });
        } catch (error) {
            console.error('Error deleting courses:', error);
            throw new Error(`Failed to delete courses: ${error.message}`);
        }
    }

    async getCourseStudentRefsByStudentIds(
        studentIds: string[],
    ): Promise<CourseStudentRef[]> {
        if (studentIds.length === 0) {
            return [];
        }
        studentIds = uniqueArray(studentIds);
        try {
            return await this.courseStudentRefRepository.find({
                where: { studentId: In(studentIds) },
            });
        } catch (error) {
            console.error(
                'Error getting course student refs by student ids:',
                error,
            );
            throw new Error(
                `Failed to get course student refs: ${error.message}`,
            );
        }
    }

    async getCourseStudentRefsByCourseIds(
        courseIds: string[],
    ): Promise<CourseStudentRef[]> {
        if (courseIds.length === 0) {
            return [];
        }
        courseIds = uniqueArray(courseIds);
        try {
            return await this.courseStudentRefRepository.find({
                where: { courseId: In(courseIds) },
            });
        } catch (error) {
            console.error(
                'Error getting course student refs by course ids:',
                error,
            );
            throw new Error(
                `Failed to get course student refs: ${error.message}`,
            );
        }
    }

    async createCourseStudentRefs(
        refs: Array<{ courseId: string; studentId: string }>,
        createdBy: string,
    ): Promise<void> {
        const now = new Date();
        try {
            const courseStudentRefs = refs.map(
                (ref) =>
                    new CourseStudentRef(
                        uuidv4(),
                        ref.studentId,
                        ref.courseId,
                        AppSource.NEST_BACKEND,
                        createdBy,
                        now,
                        AppSource.NEST_BACKEND,
                        createdBy,
                        now,
                        false,
                    ),
            );
            await this.courseStudentRefRepository.save(courseStudentRefs, {
                chunk: 1000,
                transaction: true,
            });
        } catch (error) {
            console.error('Error creating course student refs:', error);
            throw new Error(
                `Failed to create course student refs: ${error.message}`,
            );
        }
    }

    async deleteCourseStudentRefs(
        ids: string[],
        deleter: string,
    ): Promise<void> {
        const now = new Date();
        if (ids.length === 0) {
            return;
        }
        ids = uniqueArray(ids);
        try {
            await this.courseStudentRefRepository.update(ids, {
                isDeleted: true,
                updateSource: AppSource.NEST_BACKEND,
                updatedBy: deleter,
                updatedAt: now,
            });
        } catch (error) {
            console.error('Error deleting course student refs:', error);
            throw new Error(
                `Failed to delete course student refs: ${error.message}`,
            );
        }
    }
}
