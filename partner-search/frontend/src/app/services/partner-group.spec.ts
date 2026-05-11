import {TestBed} from '@angular/core/testing';
import {Mock} from 'vitest';
import {of} from 'rxjs';
import {GroupDto, GroupListResponse, PartnerGatewayService} from '../api';
import {PartnerGroupService} from './partner-group.service';

describe('PartnerGroupService', () => {
  let service: PartnerGroupService;
  let mockPartnerGatewayService: { getAllGroups: Mock };

  const group1: GroupDto = {
    groupId: 1,
    name1: "group1",
    name2: "group12",
  };

  const group2: GroupDto = {
    groupId: 2,
    name1: "group2",
  };

  const groups: GroupDto[] = [
    group1,
    group2,
  ];
  const groupListResponse: GroupListResponse = {
    groups: groups,
  }

  beforeEach(() => {
    mockPartnerGatewayService = {
      getAllGroups: vi.fn(),
    }
    TestBed.configureTestingModule({
      providers: [
        PartnerGroupService,
        {provide: PartnerGatewayService, useValue: mockPartnerGatewayService},
      ],
    })

    service = TestBed.inject(PartnerGroupService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });


  describe('loadGroups', () => {
    it('should set the groups and select options', () => {
      // Given
      mockPartnerGatewayService.getAllGroups.mockReturnValue(of(groupListResponse));

      // When
      service.loadGroups(["oldGroup"]).subscribe();

      // Then
      expect(mockPartnerGatewayService.getAllGroups).toHaveBeenCalled();
      expect(service.allGroups()).toEqual(groups);
      expect(service.selectOptions()).toEqual(expect.arrayContaining(
        [
          expect.objectContaining({
            value: "group1",
            label: "group1 - group12",
            groupId: 1,
          }),
          expect.objectContaining({
            value: "group2",
            label: "group2",
            groupId: 2,
          }),
          expect.objectContaining({
            value: "oldGroup",
            label: "oldGroup (inactive)",
          }),
        ],
      ))
    });
  });

  describe('getGroupSelectOptions', () => {
    it('should return group select options', () => {
      // Given
      mockPartnerGatewayService.getAllGroups.mockReturnValue(of(groupListResponse))
      service.loadGroups([]).subscribe();

      // When
      const result = service.getGroupSelectOptions();

      // Then
      expect(result).toEqual([
        "group1",
        "group2",
      ])
    });
  });

  describe('findGroupByName', () => {
    it('should find the group with name1', () => {
      // Given
      const targetGroup = {
        name1: "testGroup",
      };
      const groups = [
        targetGroup,
        group1,
        group2,
      ];
      const groupListResponse = {
        groups: groups,
      }
      mockPartnerGatewayService.getAllGroups.mockReturnValue(of(groupListResponse));
      service.loadGroups([]).subscribe();

      // When
      const result = service.findGroupByName("testGroup");

      // Then
      expect(result).toEqual(targetGroup);

    })
  });
});
