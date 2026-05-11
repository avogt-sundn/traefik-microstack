package com.example.partner.dto;

import java.util.List;

public record CompletionResponse(List<CompletionItem> completions) {

    public record CompletionItem(String value, String display) {}
}
