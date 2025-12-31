/**
 * Database Schema for MedicareHMS Database
 * Generated from init_tables.sql
 * This file contains the complete PostgreSQL schema definition as JavaScript objects
 */

const dbSchema = {
  // Enable UUID extension
  extensions: ['uuid-ossp'],

  tables: {
    Roles: {
      columns: {
        RoleId: { type: 'UUID', primaryKey: true, default: 'gen_random_uuid()' },
        RoleName: { type: 'VARCHAR(255)', notNull: true, unique: true },
        RoleDescription: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        UpdatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: []
    },

    DoctorDepartment: {
      columns: {
        DoctorDepartmentId: { type: 'SERIAL', primaryKey: true },
        DepartmentName: { type: 'VARCHAR(255)', notNull: true, unique: true },
        DepartmentCategory: {
          type: 'VARCHAR(50)',
          check: "IN ('Clinical', 'Surgical', 'Diagnostic', 'Critical Care', 'Support')"
        },
        SpecialisationDetails: { type: 'TEXT' },
        NoOfDoctors: { type: 'INTEGER', default: 0 },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: []
    },

    Users: {
      columns: {
        UserId: { type: 'SERIAL', primaryKey: true },
        RoleId: { type: 'UUID', notNull: true },
        UserName: { type: 'VARCHAR(255)', notNull: true },
        Password: { type: 'VARCHAR(255)', notNull: true },
        PhoneNo: { type: 'VARCHAR(20)' },
        EmailId: { type: 'VARCHAR(255)' },
        DoctorDepartmentId: { type: 'INTEGER' },
        DoctorQualification: { type: 'TEXT' },
        DoctorType: { type: 'VARCHAR(50)', check: "IN ('INHOUSE', 'VISITING')" },
        DoctorOPDCharge: { type: 'DECIMAL(10, 2)' },
        DoctorSurgeryCharge: { type: 'DECIMAL(10, 2)' },
        OPDConsultation: { type: 'VARCHAR(10)', check: "IN ('Yes', 'No')" },
        IPDVisit: { type: 'VARCHAR(10)', check: "IN ('Yes', 'No')" },
        OTHandle: { type: 'VARCHAR(10)', check: "IN ('Yes', 'No')" },
        ICUVisits: { type: 'VARCHAR(10)', check: "IN ('Yes', 'No')" },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'RoleId', references: 'Roles.RoleId', onDelete: 'RESTRICT' },
        { column: 'DoctorDepartmentId', references: 'DoctorDepartment.DoctorDepartmentId', onDelete: 'SET NULL' },
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_users_roleid ON "RoleId"',
        'idx_users_doctordepartmentid ON "DoctorDepartmentId"'
      ]
    },

    PatientRegistration: {
      columns: {
        PatientId: { type: 'UUID', primaryKey: true, default: 'gen_random_uuid()' },
        PatientNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        PatientName: { type: 'VARCHAR(255)', notNull: true },
        LastName: { type: 'VARCHAR(255)' },
        PhoneNo: { type: 'VARCHAR(20)', notNull: true },
        Gender: { type: 'VARCHAR(10)' },
        Age: { type: 'INTEGER' },
        Address: { type: 'TEXT' },
        AdhaarID: { type: 'VARCHAR(12)', unique: true },
        PANCard: { type: 'VARCHAR(10)' },
        PatientType: { type: 'VARCHAR(50)' },
        ChiefComplaint: { type: 'TEXT' },
        Description: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        RegisteredBy: { type: 'INTEGER' },
        RegisteredDate: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'RegisteredBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patient_registeredby ON "RegisteredBy"',
        'idx_patient_patientno ON "PatientNo"',
        'idx_patient_status ON "Status"'
      ]
    },

    RoomBeds: {
      columns: {
        RoomBedsId: { type: 'SERIAL', primaryKey: true },
        BedNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        RoomNo: { type: 'VARCHAR(50)' },
        RoomCategory: { type: 'VARCHAR(50)', notNull: true, check: "IN ('AC', 'Non AC')" },
        RoomType: { type: 'VARCHAR(50)', notNull: true, check: "IN ('Special', 'Special Shared', 'Regular')" },
        ChargesPerDay: { type: 'DECIMAL(10, 2)', notNull: true },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_roombeds_bedno ON "BedNo"',
        'idx_roombeds_roomno ON "RoomNo"',
        'idx_roombeds_roomcategory ON "RoomCategory"',
        'idx_roombeds_roomtype ON "RoomType"',
        'idx_roombeds_status ON "Status"',
        'idx_roombeds_createdby ON "CreatedBy"'
      ]
    },

    LabTest: {
      columns: {
        LabTestId: { type: 'SERIAL', primaryKey: true },
        DisplayTestId: { type: 'VARCHAR(100)', notNull: true, unique: true },
        TestName: { type: 'VARCHAR(255)', notNull: true },
        TestCategory: { type: 'VARCHAR(255)', notNull: true },
        Description: { type: 'TEXT' },
        Charges: { type: 'DECIMAL(10, 2)', notNull: true },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [],
      indexes: []
    },

    ICU: {
      columns: {
        ICUId: { type: 'SERIAL', primaryKey: true },
        ICUBedNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        ICUType: { type: 'VARCHAR(100)' },
        ICURoomNameNo: { type: 'VARCHAR(100)' },
        ICUDescription: { type: 'TEXT' },
        IsVentilatorAttached: { type: 'VARCHAR(10)', notNull: true, check: "IN ('Yes', 'No')" },
        ICUStartTimeofDay: { type: 'TIME' },
        ICUEndTimeofDay: { type: 'TIME' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: []
    },

    EmergencyBed: {
      columns: {
        EmergencyBedId: { type: 'SERIAL', primaryKey: true },
        EmergencyBedNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        EmergencyRoomNameNo: { type: 'VARCHAR(100)' },
        EmergencyRoomDescription: { type: 'TEXT' },
        ChargesPerDay: { type: 'DECIMAL(10, 2)' },
        Status: { type: 'VARCHAR(50)', default: "'Unoccupied'", check: "IN ('Active', 'Inactive', 'Occupied', 'Unoccupied')" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: []
    },

    EmergencyBedSlot: {
      columns: {
        EmergencyBedSlotId: { type: 'SERIAL', primaryKey: true },
        EmergencyBedId: { type: 'INTEGER', notNull: true },
        EBedSlotNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        ESlotStartTime: { type: 'TIME', notNull: true },
        ESlotEndTime: { type: 'TIME', notNull: true },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'EmergencyBedId', references: 'EmergencyBed.EmergencyBedId', onDelete: 'RESTRICT' }
      ],
      indexes: [
        'idx_emergencybedslot_emergencybedid ON "EmergencyBedId"',
        'idx_emergencybedslot_ebedslotno ON "EBedSlotNo"',
        'idx_emergencybedslot_status ON "Status"',
        'idx_emergencybedslot_slotstarttime ON "ESlotStartTime"',
        'idx_emergencybedslot_slotendtime ON "ESlotEndTime"',
        'idx_emergencybedslot_slottime ON "EmergencyBedId", "ESlotStartTime", "ESlotEndTime"'
      ]
    },

    OT: {
      columns: {
        OTId: { type: 'SERIAL', primaryKey: true },
        OTNo: { type: 'VARCHAR(50)', notNull: true, unique: true },
        OTType: { type: 'VARCHAR(100)' },
        OTName: { type: 'VARCHAR(255)' },
        OTDescription: { type: 'TEXT' },
        OTStartTimeofDay: { type: 'TIME' },
        OTEndTimeofDay: { type: 'TIME' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: []
    },

    OTSlot: {
      columns: {
        OTSlotId: { type: 'SERIAL', primaryKey: true },
        OTId: { type: 'INTEGER', notNull: true },
        OTSlotNo: { type: 'INTEGER', notNull: true },
        SlotStartTime: { type: 'TIME', notNull: true },
        SlotEndTime: { type: 'TIME', notNull: true },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'InActive')" },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'OTId', references: 'OT.OTId', onDelete: 'RESTRICT' }
      ],
      constraints: [
        'UNIQUE ("OTId", "OTSlotNo")'
      ],
      indexes: [
        'idx_otslot_otid ON "OTId"',
        'idx_otslot_status ON "Status"',
        'idx_otslot_slotstarttime ON "SlotStartTime"',
        'idx_otslot_slotendtime ON "SlotEndTime"',
        'idx_otslot_slottime ON "OTId", "SlotStartTime", "SlotEndTime"'
      ]
    },

    PatientAppointment: {
      columns: {
        PatientAppointmentId: { type: 'SERIAL', primaryKey: true },
        PatientId: { type: 'UUID', notNull: true },
        DoctorId: { type: 'INTEGER', notNull: true },
        AppointmentDate: { type: 'DATE', notNull: true },
        AppointmentTime: { type: 'TIME', notNull: true },
        TokenNo: { type: 'VARCHAR(20)', notNull: true, unique: true },
        AppointmentStatus: { type: 'VARCHAR(50)', default: "'Waiting'" },
        ConsultationCharge: { type: 'DECIMAL(10, 2)' },
        Diagnosis: { type: 'TEXT' },
        FollowUpDetails: { type: 'TEXT' },
        PrescriptionsUrl: { type: 'TEXT' },
        ToBeAdmitted: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        ReferToAnotherDoctor: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        ReferredDoctorId: { type: 'INTEGER' },
        TransferToIPDOTICU: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        TransferTo: { type: 'VARCHAR(50)', check: "IN ('IPD Room Admission', 'ICU', 'OT')" },
        TransferDetails: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedDate: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'DoctorId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'ReferredDoctorId', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_appointment_patientid ON "PatientId"',
        'idx_appointment_doctorid ON "DoctorId"',
        'idx_appointment_date ON "AppointmentDate"',
        'idx_appointment_status ON "AppointmentStatus"',
        'idx_appointment_tokenno ON "TokenNo"'
      ]
    },

    PatientICUAdmission: {
      columns: {
        PatientICUAdmissionId: { type: 'UUID', primaryKey: true },
        PatientId: { type: 'UUID', notNull: true },
        PatientAppointmentId: { type: 'INTEGER' },
        EmergencyAdmissionId: { type: 'INTEGER' },
        RoomAdmissionId: { type: 'INTEGER' },
        PatientType: { type: 'VARCHAR(50)', check: "IN ('OPD', 'IPD', 'Emergency', 'Direct')" },
        ICUId: { type: 'INTEGER', notNull: true },
        ICUPatientStatus: { type: 'VARCHAR(50)' },
        ICUAdmissionStatus: { type: 'VARCHAR(50)', default: "'Occupied'", check: "IN ('Occupied', 'Discharged')" },
        ICUAllocationFromDate: { type: 'DATE' },
        ICUAllocationToDate: { type: 'DATE' },
        NumberOfDays: { type: 'INTEGER' },
        Diagnosis: { type: 'TEXT' },
        TreatementDetails: { type: 'TEXT' },
        PatientCondition: { type: 'TEXT' },
        ICUAllocationCreatedBy: { type: 'INTEGER' },
        ICUAllocationCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        OnVentilator: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        AttendingDoctorId: { type: 'INTEGER' }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'PatientAppointmentId', references: 'PatientAppointment.PatientAppointmentId', onDelete: 'SET NULL' },
        { column: 'EmergencyAdmissionId', references: 'EmergencyAdmission.EmergencyAdmissionId', onDelete: 'SET NULL' },
        { column: 'RoomAdmissionId', references: 'RoomAdmission.RoomAdmissionId', onDelete: 'SET NULL' },
        { column: 'ICUId', references: 'ICU.ICUId', onDelete: 'RESTRICT' },
        { column: 'ICUAllocationCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'AttendingDoctorId', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patienticuadmission_patientid ON "PatientId"',
        'idx_patienticuadmission_patientappointmentid ON "PatientAppointmentId"',
        'idx_patienticuadmission_icuid ON "ICUId"',
        'idx_patienticuadmission_icupatientstatus ON "ICUPatientStatus"',
        'idx_patienticuadmission_status ON "Status"',
        'idx_patienticuadmission_allocationfromdate ON "ICUAllocationFromDate"',
        'idx_patienticuadmission_roomadmissionid ON "RoomAdmissionId"'
      ]
    },

    RoomAdmission: {
      columns: {
        RoomAdmissionId: { type: 'SERIAL', primaryKey: true },
        PatientAppointmentId: { type: 'INTEGER' },
        EmergencyAdmissionId: { type: 'INTEGER' },
        PatientType: { type: 'VARCHAR(50)', check: "IN ('OPD', 'Emergency', 'Direct')" },
        AdmittingDoctorId: { type: 'INTEGER', notNull: true },
        PatientId: { type: 'UUID', notNull: true },
        RoomBedsId: { type: 'INTEGER', notNull: true },
        RoomAllocationDate: { type: 'TIMESTAMP', notNull: true },
        RoomVacantDate: { type: 'TIMESTAMP' },
        AdmissionStatus: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Moved to ICU', 'Surgery Scheduled', 'Discharged')" },
        CaseSheetDetails: { type: 'TEXT' },
        CaseSheet: { type: 'TEXT' },
        ShiftToAnotherRoom: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        ShiftedTo: { type: 'INTEGER' },
        ShiftedToDetails: { type: 'TEXT' },
        ScheduleOT: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        OTAdmissionId: { type: 'INTEGER' },
        IsLinkedToICU: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        ICUAdmissionId: { type: 'UUID' },
        AllocatedBy: { type: 'INTEGER' },
        AllocatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" }
      },
      foreignKeys: [
        { column: 'PatientAppointmentId', references: 'PatientAppointment.PatientAppointmentId', onDelete: 'SET NULL' },
        { column: 'EmergencyAdmissionId', references: 'EmergencyAdmission.EmergencyAdmissionId', onDelete: 'SET NULL' },
        { column: 'AdmittingDoctorId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'RoomBedsId', references: 'RoomBeds.RoomBedsId', onDelete: 'RESTRICT' },
        { column: 'ShiftedTo', references: 'RoomBeds.RoomBedsId', onDelete: 'SET NULL' },
        { column: 'ICUAdmissionId', references: 'PatientICUAdmission.PatientICUAdmissionId', onDelete: 'SET NULL' },
        { column: 'AllocatedBy', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'OTAdmissionId', references: 'PatientOTAllocation.PatientOTAllocationId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_roomadmission_patientid ON "PatientId"',
        'idx_roomadmission_patientappointmentid ON "PatientAppointmentId"',
        'idx_roomadmission_admittingdoctorid ON "AdmittingDoctorId"',
        'idx_roomadmission_roombedsid ON "RoomBedsId"',
        'idx_roomadmission_admissionstatus ON "AdmissionStatus"',
        'idx_roomadmission_status ON "Status"',
        'idx_roomadmission_allocationdate ON "RoomAllocationDate"'
      ]
    },

    PatientLabTest: {
      columns: {
        PatientLabTestsId: { type: 'SERIAL', primaryKey: true },
        PatientType: { type: 'VARCHAR(50)', notNull: true },
        PatientId: { type: 'UUID', notNull: true },
        LabTestId: { type: 'INTEGER', notNull: true },
        AppointmentId: { type: 'INTEGER' },
        RoomAdmissionId: { type: 'INTEGER' },
        EmergencyAdmissionId: { type: 'INTEGER' },
        OrderedByDoctorId: { type: 'INTEGER' },
        Priority: { type: 'VARCHAR(50)', check: "IN ('Normal', 'Urgent')" },
        LabTestDone: { type: 'VARCHAR(10)', default: "'No'" },
        ReportsUrl: { type: 'TEXT' },
        TestStatus: { type: 'VARCHAR(50)', check: "IN ('Pending', 'InProgress', 'Completed')" },
        TestDoneDateTime: { type: 'TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        CreatedBy: { type: 'INTEGER' },
        CreatedDate: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'LabTestId', references: 'LabTest.LabTestId', onDelete: 'RESTRICT' },
        { column: 'AppointmentId', references: 'PatientAppointment.PatientAppointmentId', onDelete: 'SET NULL' },
        { column: 'EmergencyAdmissionId', references: 'EmergencyAdmission.EmergencyAdmissionId', onDelete: 'SET NULL' },
        { column: 'RoomAdmissionId', references: 'RoomAdmission.RoomAdmissionId', onDelete: 'SET NULL' },
        { column: 'OrderedByDoctorId', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patientlabtest_patientid ON "PatientId"',
        'idx_patientlabtest_labtestid ON "LabTestId"',
        'idx_patientlabtest_patienttype ON "PatientType"',
        'idx_patientlabtest_status ON "Status"',
        'idx_patientlabtest_teststatus ON "TestStatus"',
        'idx_patientlabtest_roomadmissionid ON "RoomAdmissionId"',
        'idx_patientlabtest_orderedbydoctorid ON "OrderedByDoctorId"',
        'idx_patientlabtest_emergencyadmissionid ON "EmergencyAdmissionId"'
      ]
    },

    SurgeryProcedure: {
      columns: {
        SurgeryId: { type: 'SERIAL', primaryKey: true },
        SurgeryType: { type: 'VARCHAR(255)' },
        SurgeryName: { type: 'VARCHAR(255)', notNull: true },
        SurgeryDetails: { type: 'TEXT' },
        PreSurgerySpecifications: { type: 'TEXT' },
        PostSurgerySpecifications: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" },
        CreatedBy: { type: 'INTEGER' },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'CreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_surgeryprocedure_surgeryname ON "SurgeryName"',
        'idx_surgeryprocedure_surgerytype ON "SurgeryType"',
        'idx_surgeryprocedure_status ON "Status"'
      ]
    },

    PatientOTAllocation: {
      columns: {
        PatientOTAllocationId: { type: 'SERIAL', primaryKey: true },
        PatientId: { type: 'UUID', notNull: true },
        RoomAdmissionId: { type: 'INTEGER' },
        PatientAppointmentId: { type: 'INTEGER' },
        EmergencyBedSlotId: { type: 'INTEGER' },
        OTId: { type: 'INTEGER', notNull: true },
        SurgeryId: { type: 'INTEGER' },
        LeadSurgeonId: { type: 'INTEGER', notNull: true },
        AssistantDoctorId: { type: 'INTEGER' },
        AnaesthetistId: { type: 'INTEGER' },
        NurseId: { type: 'INTEGER' },
        OTAllocationDate: { type: 'DATE', notNull: true },
        Duration: { type: 'VARCHAR(50)' },
        OTStartTime: { type: 'TIME' },
        OTEndTime: { type: 'TIME' },
        OTActualStartTime: { type: 'TIME' },
        OTActualEndTime: { type: 'TIME' },
        OperationDescription: { type: 'TEXT' },
        OperationStatus: { type: 'VARCHAR(50)', default: "'Scheduled'" },
        PreOperationNotes: { type: 'TEXT' },
        PostOperationNotes: { type: 'TEXT' },
        OTDocuments: { type: 'TEXT' },
        OTAllocationCreatedBy: { type: 'INTEGER' },
        OTAllocationCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'PatientAppointmentId', references: 'PatientAppointment.PatientAppointmentId', onDelete: 'SET NULL' },
        { column: 'EmergencyBedSlotId', references: 'EmergencyBedSlot.EmergencyBedSlotId', onDelete: 'SET NULL' },
        { column: 'OTId', references: 'OT.OTId', onDelete: 'RESTRICT' },
        { column: 'SurgeryId', references: 'SurgeryProcedure.SurgeryId', onDelete: 'SET NULL' },
        { column: 'LeadSurgeonId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'AssistantDoctorId', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'AnaesthetistId', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'NurseId', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'OTAllocationCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patientotallocation_patientid ON "PatientId"',
        'idx_patientotallocation_patientappointmentid ON "PatientAppointmentId"',
        'idx_patientotallocation_otid ON "OTId"',
        'idx_patientotallocation_surgeryid ON "SurgeryId"',
        'idx_patientotallocation_leadsurgeonid ON "LeadSurgeonId"',
        'idx_patientotallocation_operationstatus ON "OperationStatus"',
        'idx_patientotallocation_allocationdate ON "OTAllocationDate"',
        'idx_patientotallocation_status ON "Status"'
      ]
    },

    PatientOTAllocationSlots: {
      columns: {
        PatientOTAllocationSlotId: { type: 'SERIAL', primaryKey: true },
        PatientOTAllocationId: { type: 'INTEGER', notNull: true },
        OTSlotId: { type: 'INTEGER', notNull: true },
        OTAllocationDate: { type: 'DATE', notNull: true },
        CreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'PatientOTAllocationId', references: 'PatientOTAllocation.PatientOTAllocationId', onDelete: 'CASCADE' },
        { column: 'OTSlotId', references: 'OTSlot.OTSlotId', onDelete: 'RESTRICT' }
      ],
      constraints: [
        'UNIQUE ("PatientOTAllocationId", "OTSlotId")'
      ],
      indexes: [
        'idx_patientotallocationslots_allocationid ON "PatientOTAllocationId"',
        'idx_patientotallocationslots_slotid ON "OTSlotId"'
      ]
    },

    EmergencyAdmission: {
      columns: {
        EmergencyAdmissionId: { type: 'SERIAL', primaryKey: true },
        DoctorId: { type: 'INTEGER', notNull: true },
        PatientId: { type: 'UUID', notNull: true },
        EmergencyBedId: { type: 'INTEGER', notNull: true },
        EmergencyAdmissionDate: { type: 'DATE', notNull: true },
        EmergencyStatus: { type: 'VARCHAR(50)', check: "IN ('Admitted', 'IPD', 'OT', 'ICU', 'Discharged')" },
        Priority: { type: 'VARCHAR(50)' },
        AllocationFromDate: { type: 'DATE' },
        AllocationToDate: { type: 'DATE' },
        NumberOfDays: { type: 'INTEGER' },
        Diagnosis: { type: 'TEXT' },
        TreatementDetails: { type: 'TEXT' },
        PatientCondition: { type: 'VARCHAR(50)', check: "IN ('Critical', 'Stable')" },
        TransferToIPD: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        TransferToOT: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        TransferToICU: { type: 'VARCHAR(10)', default: "'No'", check: "IN ('Yes', 'No')" },
        TransferTo: { type: 'VARCHAR(50)', check: "IN ('IPD', 'ICU', 'OT')" },
        TransferDetails: { type: 'TEXT' },
        AdmissionCreatedBy: { type: 'INTEGER' },
        AdmissionCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" }
      },
      foreignKeys: [
        { column: 'DoctorId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'EmergencyBedId', references: 'EmergencyBed.EmergencyBedId', onDelete: 'RESTRICT' },
        { column: 'AdmissionCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_emergencyadmission_doctorid ON "DoctorId"',
        'idx_emergencyadmission_patientid ON "PatientId"',
        'idx_emergencyadmission_emergencybedid ON "EmergencyBedId"',
        'idx_emergencyadmission_emergencystatus ON "EmergencyStatus"',
        'idx_emergencyadmission_status ON "Status"',
        'idx_emergencyadmission_admissiondate ON "EmergencyAdmissionDate"',
        'idx_emergencyadmission_allocationfromdate ON "AllocationFromDate"'
      ]
    },

    EmergencyAdmissionVitals: {
      columns: {
        EmergencyAdmissionVitalsId: { type: 'SERIAL', primaryKey: true },
        EmergencyAdmissionId: { type: 'INTEGER', notNull: true },
        NurseId: { type: 'INTEGER', notNull: true },
        RecordedDateTime: { type: 'TIMESTAMP', notNull: true },
        HeartRate: { type: 'INTEGER' },
        BloodPressure: { type: 'VARCHAR(50)' },
        Temperature: { type: 'DECIMAL(5, 2)' },
        O2Saturation: { type: 'DECIMAL(5, 2)' },
        RespiratoryRate: { type: 'INTEGER' },
        PulseRate: { type: 'INTEGER' },
        VitalsStatus: { type: 'VARCHAR(50)', check: "IN ('Stable', 'Critical', 'Improving')" },
        VitalsRemarks: { type: 'TEXT' },
        VitalsCreatedBy: { type: 'INTEGER' },
        VitalsCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" }
      },
      foreignKeys: [
        { column: 'EmergencyAdmissionId', references: 'EmergencyAdmission.EmergencyAdmissionId', onDelete: 'RESTRICT' },
        { column: 'NurseId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'VitalsCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_emergencyadmissionvitals_emergencyadmissionid ON "EmergencyAdmissionId"',
        'idx_emergencyadmissionvitals_nurseid ON "NurseId"',
        'idx_emergencyadmissionvitals_recordeddatetime ON "RecordedDateTime"',
        'idx_emergencyadmissionvitals_vitalsstatus ON "VitalsStatus"',
        'idx_emergencyadmissionvitals_status ON "Status"'
      ]
    },

    ICUDoctorVisits: {
      columns: {
        ICUDoctorVisitsId: { type: 'UUID', primaryKey: true },
        ICUAdmissionId: { type: 'UUID', notNull: true },
        PatientId: { type: 'UUID', notNull: true },
        DoctorId: { type: 'INTEGER', notNull: true },
        DoctorVisitedDateTime: { type: 'TIMESTAMP', notNull: true },
        VisitsDetails: { type: 'TEXT' },
        PatientCondition: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" },
        VisitCreatedBy: { type: 'INTEGER' },
        VisitCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'ICUAdmissionId', references: 'PatientICUAdmission.PatientICUAdmissionId', onDelete: 'RESTRICT' },
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'DoctorId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'VisitCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_icudoctorvisits_icuadmissionid ON "ICUAdmissionId"',
        'idx_icudoctorvisits_patientid ON "PatientId"',
        'idx_icudoctorvisits_doctorid ON "DoctorId"',
        'idx_icudoctorvisits_visiteddatetime ON "DoctorVisitedDateTime"',
        'idx_icudoctorvisits_status ON "Status"'
      ]
    },

    ICUVisitVitals: {
      columns: {
        ICUVisitVitalsId: { type: 'UUID', primaryKey: true },
        ICUAdmissionId: { type: 'UUID', notNull: true },
        PatientId: { type: 'UUID', notNull: true },
        NurseId: { type: 'INTEGER' },
        NurseVisitsDetails: { type: 'TEXT' },
        PatientCondition: { type: 'VARCHAR(50)', check: "IN ('Stable', 'Notstable')" },
        DailyOrHourlyVitals: { type: 'VARCHAR(50)', check: "IN ('Daily Vitals', 'Hourly Vitals')" },
        RecordedDateTime: { type: 'TIMESTAMP', notNull: true },
        HeartRate: { type: 'INTEGER' },
        BloodPressure: { type: 'VARCHAR(50)' },
        Temperature: { type: 'DECIMAL(5, 2)' },
        O2Saturation: { type: 'DECIMAL(5, 2)' },
        RespiratoryRate: { type: 'INTEGER' },
        PulseRate: { type: 'INTEGER' },
        BloodSugar: { type: 'DECIMAL(5, 2)' },
        VitalsStatus: { type: 'VARCHAR(50)', check: "IN ('Stable', 'Critical', 'Improving', 'Normal')" },
        VitalsRemarks: { type: 'TEXT' },
        VitalsCreatedBy: { type: 'INTEGER' },
        VitalsCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" }
      },
      foreignKeys: [
        { column: 'ICUAdmissionId', references: 'PatientICUAdmission.PatientICUAdmissionId', onDelete: 'RESTRICT' },
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'VitalsCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'NurseId', references: 'Users.UserId', onDelete: 'RESTRICT' }
      ],
      indexes: [
        'idx_icuvisitvitals_icuadmissionid ON "ICUAdmissionId"',
        'idx_icuvisitvitals_patientid ON "PatientId"',
        'idx_icuvisitvitals_nurseid ON "NurseId"',
        'idx_icuvisitvitals_dailyorhourlyvitals ON "DailyOrHourlyVitals"',
        'idx_icuvisitvitals_patientcondition ON "PatientCondition"',
        'idx_icuvisitvitals_recordeddatetime ON "RecordedDateTime"',
        'idx_icuvisitvitals_vitalsstatus ON "VitalsStatus"',
        'idx_icuvisitvitals_status ON "Status"'
      ]
    },

    PatientAdmitDoctorVisits: {
      columns: {
        PatientAdmitDoctorVisitsId: { type: 'UUID', primaryKey: true },
        RoomAdmissionId: { type: 'INTEGER' },
        PatientId: { type: 'UUID', notNull: true },
        DoctorId: { type: 'INTEGER', notNull: true },
        DoctorVisitedDateTime: { type: 'TIMESTAMP', notNull: true },
        VisitsRemarks: { type: 'TEXT' },
        PatientCondition: { type: 'TEXT' },
        Status: { type: 'VARCHAR(50)', default: "'Active'" },
        VisitCreatedBy: { type: 'INTEGER' },
        VisitCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'DoctorId', references: 'Users.UserId', onDelete: 'RESTRICT' },
        { column: 'VisitCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'RoomAdmissionId', references: 'RoomAdmission.RoomAdmissionId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patientadmitdoctorvisits_patientid ON "PatientId"',
        'idx_patientadmitdoctorvisits_doctorid ON "DoctorId"',
        'idx_patientadmitdoctorvisits_visiteddatetime ON "DoctorVisitedDateTime"',
        'idx_patientadmitdoctorvisits_status ON "Status"'
      ]
    },

    PatientAdmitVisitVitals: {
      columns: {
        PatientAdmitVisitVitalsId: { type: 'UUID', primaryKey: true },
        RoomAdmissionId: { type: 'INTEGER' },
        PatientId: { type: 'UUID', notNull: true },
        NurseId: { type: 'INTEGER' },
        PatientStatus: { type: 'VARCHAR(50)', check: "IN ('Stable', 'Notstable')" },
        RecordedDateTime: { type: 'DATE', notNull: true },
        VisitRemarks: { type: 'TEXT' },
        DailyOrHourlyVitals: { type: 'VARCHAR(50)', check: "IN ('Daily Vitals', 'Hourly Vitals')" },
        HeartRate: { type: 'INTEGER' },
        BloodPressure: { type: 'VARCHAR(50)' },
        Temperature: { type: 'INTEGER' },
        O2Saturation: { type: 'INTEGER' },
        RespiratoryRate: { type: 'INTEGER' },
        PulseRate: { type: 'INTEGER' },
        VitalsStatus: { type: 'VARCHAR(50)', check: "IN ('Stable', 'Critical', 'Improving', 'Normal')" },
        VitalsRemarks: { type: 'TEXT' },
        VitalsCreatedBy: { type: 'INTEGER' },
        VitalsCreatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        Status: { type: 'VARCHAR(50)', default: "'Active'", check: "IN ('Active', 'Inactive')" }
      },
      foreignKeys: [
        { column: 'PatientId', references: 'PatientRegistration.PatientId', onDelete: 'RESTRICT' },
        { column: 'VitalsCreatedBy', references: 'Users.UserId', onDelete: 'SET NULL' },
        { column: 'RoomAdmissionId', references: 'RoomAdmission.RoomAdmissionId', onDelete: 'SET NULL' },
        { column: 'NurseId', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_patientadmitvisitvitals_patientid ON "PatientId"',
        'idx_patientadmitvisitvitals_patientstatus ON "PatientStatus"',
        'idx_patientadmitvisitvitals_dailyorhourlyvitals ON "DailyOrHourlyVitals"',
        'idx_patientadmitvisitvitals_recordeddatetime ON "RecordedDateTime"',
        'idx_patientadmitvisitvitals_vitalsstatus ON "VitalsStatus"',
        'idx_patientadmitvisitvitals_status ON "Status"',
        'idx_patientadmitvisitvitals_roomadmissionid ON "RoomAdmissionId"',
        'idx_patientadmitvisitvitals_nurseid ON "NurseId"'
      ]
    },

    AuditLog: {
      columns: {
        AuditLogId: { type: 'SERIAL', primaryKey: true },
        ActionLogName: { type: 'VARCHAR(255)', notNull: true },
        ActionBy: { type: 'INTEGER' },
        ActionDate: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      },
      foreignKeys: [
        { column: 'ActionBy', references: 'Users.UserId', onDelete: 'SET NULL' }
      ],
      indexes: [
        'idx_auditlog_actionby ON "ActionBy"',
        'idx_auditlog_actiondate ON "ActionDate"'
      ]
    }
  }
};

module.exports = dbSchema;
