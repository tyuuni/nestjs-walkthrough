import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryColumn({ name: 'id' })
    public readonly id: string;

    @Column({ name: 'nfc_card_id', unique: true })
    public readonly nfcCardId: string;

    @Column({ name: 'name' })
    public readonly name: string;

    @Column({ name: 'is_student' })
    public readonly isStudent: boolean;

    @Column({ name: 'is_teacher' })
    public readonly isTeacher: boolean;

    @Column({ name: 'teacher_id', nullable: true })
    public readonly teacherId: string;

    @Column({ name: 'creation_source' })
    public readonly creationSource: number;

    @Column({ name: 'created_by' })
    public readonly createdBy: string;

    @CreateDateColumn({ name: 'created_at' })
    public readonly createdAt: Date;

    @Column({ name: 'update_source' })
    public readonly updateSource: number;

    @Column({ name: 'updated_by' })
    public readonly updatedBy: string;

    @UpdateDateColumn({ name: 'updated_at' })
    public readonly updatedAt: Date;

    @Column({ name: 'is_deleted', default: false })
    public readonly isDeleted: boolean;

    constructor(
        id: string,
        nfcCardId: string,
        name: string,
        isStudent: boolean,
        isTeacher: boolean,
        teacherId: string,
        creationSource: number,
        createdBy: string,
        createdAt: Date,
        updateSource: number,
        updatedBy: string,
        updatedAt: Date,
        isDeleted: boolean,
    ) {
        this.id = id;
        this.nfcCardId = nfcCardId;
        this.name = name;
        this.isStudent = isStudent;
        this.isTeacher = isTeacher;
        this.teacherId = teacherId;
        this.creationSource = creationSource;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updateSource = updateSource;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
        this.isDeleted = isDeleted;
    }
}

@Entity('courses')
export class Course {
    @PrimaryColumn({ name: 'id' })
    public readonly id: string;

    @Column({ name: 'name' })
    public readonly name: string;

    @Column({ name: 'teacher_id' })
    public readonly teacherId: string;

    @Column({ name: 'creation_source', type: 'int' })
    public readonly creationSource: number;

    @Column({ name: 'created_by' })
    public readonly createdBy: string;

    @CreateDateColumn({ name: 'created_at' })
    public readonly createdAt: Date;

    @Column({ name: 'update_source', type: 'int' })
    public readonly updateSource: number;

    @Column({ name: 'updated_by' })
    public readonly updatedBy: string;

    @UpdateDateColumn({ name: 'updated_at' })
    public readonly updatedAt: Date;

    @Column({ name: 'is_deleted', type: 'boolean' })
    public readonly isDeleted: boolean;

    constructor(
        id: string,
        name: string,
        teacherId: string,
        creationSource: number,
        createdBy: string,
        createdAt: Date,
        updateSource: number,
        updatedBy: string,
        updatedAt: Date,
        isDeleted: boolean,
    ) {
        this.id = id;
        this.name = name;
        this.teacherId = teacherId;
        this.creationSource = creationSource;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updateSource = updateSource;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
        this.isDeleted = isDeleted;
    }
}

@Entity('course_student_refs')
export class CourseStudentRef {
    @PrimaryColumn({ name: 'id' })
    public readonly id: string;

    @Column({ name: 'student_id' })
    public readonly studentId: string;

    @Column({ name: 'course_id' })
    public readonly courseId: string;

    @Column({ name: 'creation_source', type: 'int' })
    public readonly creationSource: number;

    @Column({ name: 'created_by' })
    public readonly createdBy: string;

    @CreateDateColumn({ name: 'created_at' })
    public readonly createdAt: Date;

    @Column({ name: 'update_source', type: 'int' })
    public readonly updateSource: number;

    @Column({ name: 'updated_by' })
    public readonly updatedBy: string;

    @UpdateDateColumn({ name: 'updated_at' })
    public readonly updatedAt: Date;

    @Column({ name: 'is_deleted', type: 'boolean' })
    public readonly isDeleted: boolean;

    constructor(
        id: string,
        studentId: string,
        courseId: string,
        creationSource: number,
        createdBy: string,
        createdAt: Date,
        updateSource: number,
        updatedBy: string,
        updatedAt: Date,
        isDeleted: boolean,
    ) {
        this.id = id;
        this.studentId = studentId;
        this.courseId = courseId;
        this.creationSource = creationSource;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updateSource = updateSource;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
        this.isDeleted = isDeleted;
    }
}
