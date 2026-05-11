package com.example.partneredit.partner;

import com.example.partneredit.sync.SearchNotifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner-edit/spring")
public class Controller {

    private final PartnerRepository repository;
    private final SearchNotifier searchNotifier;

    public Controller(PartnerRepository repository, SearchNotifier searchNotifier) {
        this.repository = repository;
        this.searchNotifier = searchNotifier;
    }

    @GetMapping("/{partnerNumber}")
    public ResponseEntity<DetailResponse> get(@PathVariable Long partnerNumber) {
        return repository.findByPartnerNumber(partnerNumber)
                .map(DetailResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{partnerNumber}")
    public ResponseEntity<DetailResponse> put(
            @PathVariable Long partnerNumber,
            @RequestBody EditRequest request) {
        return repository.findByPartnerNumber(partnerNumber)
                .map(partner -> {
                    partner.setAlphaCode(request.alphaCode());
                    partner.setName1(request.name1());
                    partner.setName2(request.name2());
                    partner.setName3(request.name3());
                    partner.setFirstname(request.firstname());
                    partner.setStreet(request.street());
                    partner.setHouseNumber(request.houseNumber());
                    partner.setPostalCode(request.postalCode());
                    partner.setCity(request.city());
                    partner.setType(request.type());
                    partner.setGroupType(request.groupType());
                    partner.setGroupNumber(request.groupNumber());
                    Partner saved = repository.save(partner);
                    DetailResponse response = DetailResponse.from(saved);
                    searchNotifier.notifyReindex(response);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
